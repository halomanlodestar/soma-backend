import { PostsWorkerController } from './posts-worker.controller';

describe('PostsWorkerController', () => {
  it('auto-approves media-free posts and queues publication', async () => {
    const prisma = {
      post: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const storage = {};
    const client = { emit: jest.fn() };
    const queryCache = {};
    const controller = new PostsWorkerController(
      prisma as never,
      storage as never,
      client as never,
      queryCache as never,
    );

    await controller.handleProcessMedia({ postId: 'post-id', assetIds: [] });

    expect(prisma.post.updateMany).toHaveBeenCalledWith({
      where: { id: 'post-id', visibility: 'DRAFT' },
      data: { mediaStatus: 'READY', visibility: 'APPROVED' },
    });
    expect(client.emit).toHaveBeenCalledWith('post.publish', {
      postId: 'post-id',
    });
  });
});
