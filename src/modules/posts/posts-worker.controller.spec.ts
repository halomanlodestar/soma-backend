import { PostsWorkerController } from './posts-worker.controller';

describe('PostsWorkerController', () => {
  it('marks media ready without changing post visibility', async () => {
    const prisma = {
      post: { update: jest.fn().mockResolvedValue({}) },
    };
    const storage = {};
    const controller = new PostsWorkerController(
      prisma as never,
      storage as never,
    );

    await controller.handleProcessMedia({ postId: 'post-id', media: [] });

    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: 'post-id' },
      data: { mediaStatus: 'READY' },
    });
  });
});
