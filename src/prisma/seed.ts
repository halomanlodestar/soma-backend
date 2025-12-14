import 'dotenv/config';
import { PrismaClient, VoteTargetType } from './generated/client';
import { users } from './data/users';
import { somas } from './data/somas';
import { posts } from './data/posts';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding ...');

  // CLEANUP
  await prisma.notification.deleteMany();
  await prisma.award.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.mediaVariant.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.mediaCollection.deleteMany();
  await prisma.post.deleteMany();
  await prisma.soma.deleteMany();
  await prisma.user.deleteMany();

  // USERS
  for (const u of users) {
    const user = await prisma.user.create({
      data: u,
    });
    console.log(`Created user with id: ${user.id}`);
  }

  // SOMAS
  for (const s of somas) {
    const soma = await prisma.soma.create({
      data: s,
    });
    console.log(`Created soma with id: ${soma.id}`);
  }

  // POSTS
  for (const p of posts) {
    const author = await prisma.user.findUnique({
      where: { username: p.authorUsername },
    });
    const soma = await prisma.soma.findUnique({
      where: { slug: p.somaSlug },
    });

    if (author && soma) {
      const post = await prisma.post.create({
        data: {
          title: p.title,
          body: p.body,
          authorId: author.id,
          somaId: soma.id,
        },
      });
      console.log(`Created post with id: ${post.id}`);

      // Add some votes
      const viewer = await prisma.user.findUnique({
        where: { username: 'viewer' },
      });
      if (viewer) {
        await prisma.vote.create({
          data: {
            userId: viewer.id,
            targetType: VoteTargetType.POST,
            targetId: post.id,
            value: 1,
          },
        });
      }
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
