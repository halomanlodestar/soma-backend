# Soma v1 – Database Schema (Invite-only MVP)

This document defines the **authoritative database structure** for Soma v1.
It is intended to be given directly to Copilot / AI for implementation.

Scope:

- Invite-only platform
- No creator applications yet
- High-quality media support
- Posts, comments, votes, awards
- Prisma + PostgreSQL compatible

---

## ENUMS

```prisma
enum UserRole {
  VIEWER
  CREATOR
  ADMIN
}

enum MediaType {
  IMAGE
  VIDEO
  AUDIO
}

enum VoteTargetType {
  POST
  COMMENT
}

enum MediaQuality {
  ORIGINAL
  HIGH
  MEDIUM
  LOW
  PREVIEW
}

enum AwardTargetType {
  POST
  COMMENT
}
```

---

## USER

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  username      String   @unique
  displayName   String?
  bio           String?

  role          UserRole @default(VIEWER)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  posts         Post[]
  comments      Comment[]
  votes         Vote[]
  awardsGiven   Award[]  @relation("awardedBy")
}
```

---

## SOMA (Community)

```prisma
model Soma {
  id          String   @id @default(uuid())
  slug        String   @unique
  name        String
  description String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts       Post[]
}
```

---

## POST

```prisma
model Post {
  id          String   @id @default(uuid())
  title       String
  body        String?

  authorId    String
  somaId      String

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  author      User     @relation(fields: [authorId], references: [id])
  soma        Soma     @relation(fields: [somaId], references: [id])

  comments    Comment[]
  media       MediaCollection?
  votes       Vote[]
  awards      Award[]
}
```

---

## COMMENT

Adjacency-list model for nested comments.

```prisma
model Comment {
  id              String   @id @default(uuid())
  content         String

  authorId        String
  postId          String
  parentCommentId String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  author          User     @relation(fields: [authorId], references: [id])
  post            Post     @relation(fields: [postId], references: [id])
  parent          Comment? @relation("CommentToComment", fields: [parentCommentId], references: [id])
  children        Comment[]@relation("CommentToComment")

  votes           Vote[]
  awards          Award[]
}
```

---

## VOTE

Single table for both post and comment voting.

```prisma
model Vote {
  id          String          @id @default(uuid())
  userId      String

  targetType  VoteTargetType
  targetId    String

  value       Int             // +1 or -1

  createdAt   DateTime        @default(now())

  user        User            @relation(fields: [userId], references: [id])

  @@unique([userId, targetType, targetId])
}
```

---

## MEDIA COLLECTION

One post can have one ordered media collection.

```prisma
model MediaCollection {
  id        String   @id @default(uuid())
  postId    String   @unique

  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])
  items     MediaItem[]
}
```

---

## MEDIA ITEM

Represents a single uploaded media file.

```prisma
model MediaItem {
  id              String      @id @default(uuid())
  collectionId    String

  type            MediaType
  originalUrl     String
  metadata        Json?

  createdAt       DateTime    @default(now())

  collection      MediaCollection @relation(fields: [collectionId], references: [id])
  variants        MediaVariant[]
}
```

---

## MEDIA VARIANT

Derived versions of media for delivery.

```prisma
model MediaVariant {
  id          String        @id @default(uuid())
  mediaItemId String

  quality     MediaQuality
  url         String

  width       Int?
  height      Int?
  bitrate     Int?
  duration    Float?

  createdAt   DateTime      @default(now())

  mediaItem   MediaItem     @relation(fields: [mediaItemId], references: [id])
}
```

---

## AWARD

Awards granted by users to posts or comments.

```prisma
model Award {
  id            String          @id @default(uuid())

  awardedById   String
  targetType   AwardTargetType
  targetId     String

  name          String          // e.g. "Gold", "EditorPick"

  createdAt    DateTime        @default(now())

  awardedBy    User            @relation("awardedBy", fields: [awardedById], references: [id])
}
```

---

## INDEXING RECOMMENDATIONS

To be added after initial implementation:

- `Post(createdAt)`
- `Comment(postId, createdAt)`
- `Vote(targetType, targetId)`
- `MediaItem(collectionId)`

---

## NOTES FOR IMPLEMENTATION

- Use Prisma relations as defined
- Use raw SQL for recursive comment fetching
- Preserve original media URLs permanently
- Variants can be added asynchronously
- Votes are idempotent via unique constraint

---

**This schema is intentionally minimal and extensible.**
