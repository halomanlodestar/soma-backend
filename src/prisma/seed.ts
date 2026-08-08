import {
  PrismaClient,
  UserRole,
  PostVisibility,
  MediaType,
  MediaQuality,
  SomaMembershipRole,
  SomaMembershipStatus,
} from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/soma',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning up existing data...');
  // Delete in reverse order of dependencies to avoid foreign key constraints
  await prisma.notification.deleteMany();
  await prisma.award.deleteMany();
  await prisma.mediaVariant.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.mediaCollection.deleteMany();
  await prisma.somaCreatorApplication.deleteMany();
  await prisma.somaMembership.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.soma.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      platformRole: UserRole.ADMIN,
      emailVerified: true,
      profile: {
        create: {
          username: 'alice_admin',
          displayName: 'Alice (Admin)',
          bio: 'Administrator of Soma.',
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      platformRole: UserRole.CREATOR,
      emailVerified: true,
      profile: {
        create: {
          username: 'bob_creator',
          displayName: 'Bob The Creator',
          bio: 'I make cool stuff.',
        },
      },
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      platformRole: UserRole.VIEWER,
      profile: {
        create: {
          username: 'charlie_viewer',
          displayName: 'Charlie',
          bio: 'Just looking around.',
        },
      },
    },
  });

  console.log('Seeding Follows...');
  await prisma.follow.createMany({
    data: [
      { followerId: user2.id, followingId: user1.id },
      { followerId: user3.id, followingId: user1.id },
      { followerId: user3.id, followingId: user2.id },
    ],
  });

  console.log('Seeding Somas...');
  const soma1 = await prisma.soma.create({
    data: {
      slug: 'technology',
      name: 'Technology',
      description: 'All things tech, coding, and gadgets.',
      memberCount: 3,
      weeklyVisitorCount: 15,
    },
  });

  const soma2 = await prisma.soma.create({
    data: {
      slug: 'art',
      name: 'Digital Art',
      description: 'A place for digital artists to share their work.',
      memberCount: 2,
      weeklyVisitorCount: 5,
    },
  });

  const [technologyOwner, artOwner, technologyCreator, artCreator] =
    await Promise.all([
      prisma.somaMembership.create({
        data: {
          userId: user1.id,
          somaId: soma1.id,
          role: SomaMembershipRole.OWNER,
          status: SomaMembershipStatus.ACTIVE,
          approvedById: user1.id,
          approvedAt: new Date(),
        },
      }),
      prisma.somaMembership.create({
        data: {
          userId: user1.id,
          somaId: soma2.id,
          role: SomaMembershipRole.OWNER,
          status: SomaMembershipStatus.ACTIVE,
          approvedById: user1.id,
          approvedAt: new Date(),
        },
      }),
      prisma.somaMembership.create({
        data: {
          userId: user2.id,
          somaId: soma1.id,
          role: SomaMembershipRole.CREATOR,
          status: SomaMembershipStatus.ACTIVE,
          approvedById: user1.id,
          approvedAt: new Date(),
        },
      }),
      prisma.somaMembership.create({
        data: {
          userId: user2.id,
          somaId: soma2.id,
          role: SomaMembershipRole.CREATOR,
          status: SomaMembershipStatus.ACTIVE,
          approvedById: user1.id,
          approvedAt: new Date(),
        },
      }),
    ]);

  console.log('Seeding Posts...');
  const post1 = await prisma.post.create({
    data: {
      title: 'The Future of AI',
      body: 'AI is advancing at a rapid pace...',
      excerpt: 'AI is advancing...',
      authorId: user1.id,
      somaId: soma1.id,
      creatorMembershipId: technologyOwner.id,
      visibility: PostVisibility.PUBLISHED,
      impressions: 150,
      voteCount: 2,
      commentCount: 1,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'My Latest Digital Painting',
      body: 'Took me 15 hours on Procreate.',
      excerpt: 'Digital painting on Procreate.',
      authorId: user2.id,
      somaId: soma2.id,
      creatorMembershipId: artCreator.id,
      mediaStatus: 'READY',
      visibility: PostVisibility.PUBLISHED,
      impressions: 200,
      voteCount: 1,
      commentCount: 1,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: 'NestJS Best Practices',
      body: 'Let us discuss how to properly architect NestJS apps.',
      excerpt: 'NestJS architecture.',
      authorId: user2.id,
      somaId: soma1.id,
      creatorMembershipId: technologyCreator.id,
      visibility: PostVisibility.PUBLISHED,
      impressions: 80,
    },
  });

  console.log('Seeding Comments...');
  const comment1 = await prisma.comment.create({
    data: {
      content: 'I completely agree with this take!',
      authorId: user2.id,
      postId: post1.id,
      voteCount: 1,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: 'Wow, the colors are amazing.',
      authorId: user3.id,
      postId: post2.id,
    },
  });

  const comment3 = await prisma.comment.create({
    data: {
      content: 'Any tips for shading?',
      authorId: user1.id,
      postId: post2.id,
      parentCommentId: comment2.id, // Reply to comment2
    },
  });

  console.log('Seeding Votes...');
  await prisma.vote.createMany({
    data: [
      { userId: user2.id, postId: post1.id, value: 1 },
      { userId: user3.id, postId: post1.id, value: 1 },
      { userId: user1.id, postId: post2.id, value: 1 },
      { userId: user1.id, commentId: comment1.id, value: 1 },
    ],
  });

  console.log('Seeding Media...');
  const mediaCollection = await prisma.mediaCollection.create({
    data: {
      postId: post2.id,
      items: {
        create: {
          type: MediaType.IMAGE,
          originalUrl: 'https://example.com/images/painting-original.png',
          s3Key: 'uploads/painting-original.png',
          variants: {
            create: [
              {
                quality: MediaQuality.HIGH,
                url: 'https://example.com/images/painting-high.jpg',
                width: 1920,
                height: 1080,
              },
              {
                quality: MediaQuality.PREVIEW,
                url: 'https://example.com/images/painting-preview.jpg',
                width: 320,
                height: 180,
              },
            ],
          },
        },
      },
    },
  });

  console.log('Seeding Awards...');
  await prisma.award.createMany({
    data: [
      {
        name: 'Gold',
        awardedById: user1.id,
        postId: post2.id,
      },
      {
        name: 'Helpful',
        awardedById: user3.id,
        commentId: comment1.id,
      },
    ],
  });

  console.log('Seeding Notifications...');
  await prisma.notification.createMany({
    data: [
      {
        recipientId: user1.id,
        actorId: user2.id,
        eventType: 'comment.created.v1',
        eventData: { resource: { type: 'post', id: post1.id } },
        sourceEventId: 'seed:notification:comment:1',
      },
      {
        recipientId: user2.id,
        actorId: user1.id,
        eventType: 'award.granted.v1',
        eventData: { resource: { type: 'post', id: post2.id } },
        sourceEventId: 'seed:notification:award:1',
      },
      {
        recipientId: user3.id,
        actorId: user1.id,
        eventType: 'comment.reply.v1',
        eventData: { resource: { type: 'comment', id: comment2.id } },
        sourceEventId: 'seed:notification:reply:1',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
