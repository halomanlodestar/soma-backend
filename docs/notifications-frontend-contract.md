# Notifications Frontend Contract

This document defines how the notification inbox page consumes the current GraphQL API and interprets `eventData`.

## API

All operations require an authenticated GraphQL request. The API returns notifications for the current user only; do not supply or trust a recipient ID from the client.

```graphql
query GetNotifications {
  getNotifications {
    id
    recipientId
    actorId
    eventType
    eventData
    readAt
    createdAt
  }
}
```

Results are newest first. There is no pagination or real-time subscription yet, so refetch on page open and after returning to the app.

Mark an item read after the user opens its destination:

```graphql
mutation MarkNotificationAsRead($id: String!) {
  markNotificationAsRead(id: $id) {
    __typename
    ... on Notification {
      id
      readAt
    }
    ... on NotFoundError {
      message
    }
    ... on UnauthorizedError {
      message
    }
  }
}
```

## Stable fields

| Field | Meaning | Frontend use |
| --- | --- | --- |
| `id` | Inbox-row ID | React key and read mutation ID. |
| `recipientId` | User receiving this inbox item | Must match the active session; otherwise discard the item. |
| `actorId` | User who caused it, or `null` for system events | Fetch/display actor profile when present. |
| `eventType` | Versioned event contract | Select renderer and navigation behavior. |
| `eventData` | JSON payload defined by `eventType` | Validate before use. |
| `readAt` | `null` means unread | Show unread treatment/badge. |
| `createdAt` | Creation timestamp | Relative time and ordering. |

Do not depend on database-only fields such as `sourceEventId`.

## Event-data contracts

Treat unknown event types as valid future data: show a generic notification card, do not crash, and keep the item markable as read.

### `comment.created.v1`

Sent when another user comments on the recipient's post. A self-comment intentionally produces no notification.

```ts
type CommentCreatedData = {
  resource: { type: 'comment'; id: string };
  context: { postId: string };
  template: {
    key: 'notification.comment.created';
    variables: { postTitle: string };
  };
};
```

Render: “`{actor name}` commented on your post.” Use `postTitle` as secondary text if desired. Navigate to the post using `context.postId`; optionally scroll to `resource.id`.

### `award.granted.v1`

Sent when another user gives the recipient an award.

```ts
type AwardGrantedData = {
  resource: { type: 'award'; id: string };
  context: {
    targetType: 'POST' | 'COMMENT';
    targetId: string;
  };
  template: {
    key: 'notification.award.granted';
    variables: { awardName: string };
  };
};
```

Navigate to the post or comment according to `targetType`. Display `awardName`; do not render arbitrary HTML from JSON values.

## TypeScript parsing pattern

`eventData` is GraphQL `JSON`, so validate its runtime shape before rendering.

```ts
type Notification = {
  id: string;
  recipientId: string;
  actorId: string | null;
  eventType: string;
  eventData: unknown;
  readAt: string | null;
  createdAt: string;
};

function getNotificationTarget(notification: Notification): string | null {
  const data = notification.eventData as Record<string, unknown>;
  const context = data?.context as Record<string, unknown> | undefined;

  if (notification.eventType === 'comment.created.v1') {
    return typeof context?.postId === 'string' ? `/posts/${context.postId}` : null;
  }
  if (notification.eventType === 'award.granted.v1') {
    return typeof context?.targetId === 'string'
      ? `/${context.targetType === 'COMMENT' ? 'comments' : 'posts'}/${context.targetId}`
      : null;
  }
  return null;
}
```

Prefer Zod or an equivalent per-event schema in the actual app; the cast above illustrates routing only.

## Page behavior

- Show an empty state when `getNotifications` returns `[]`.
- Keep unread styling until `markNotificationAsRead` succeeds; optimistically update `readAt` and roll back on an error.
- Mark on opening the detail destination, not merely when the item enters the viewport.
- If the related content is deleted or inaccessible, show a non-clickable “This content is no longer available” item and still allow marking it read.
- Deduplicate client cache entries by `id`, never by `eventType` or displayed text.
- Do not assume every notification has an actor or a navigation target.

## Adding a new event type

Backend changes must add a versioned `eventType`, publish a documented JSON payload, and update this document in the same change. The frontend must add a renderer only after agreeing on the payload contract; never infer behavior from a loosely named event type.
