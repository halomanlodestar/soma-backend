import { PostsWorkerController } from './posts-worker.controller';
import { MediaMetadataError } from '../media/media-metadata.service';

describe('PostsWorkerController', () => {
  it('auto-approves media-free posts and queues publication', async () => {
    const prisma = {
      post: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const storage = {};
    const metadata = {};
    const client = { emit: jest.fn() };
    const queryCache = {};
    const controller = new PostsWorkerController(
      prisma as never,
      storage as never,
      metadata as never,
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

  it('marks the post and its assets failed when probing rejects the upload', async () => {
    const prisma = {
      post: {
        findUnique: jest.fn().mockResolvedValue({ authorId: 'author-id' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      mediaAsset: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'asset-id',
            stagingKey: 'staging/author-id/asset-id.mp4',
            type: 'VIDEO',
            declaredMimeType: 'video/mp4',
            declaredByteSize: 100n,
          },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const storage = {
      verifyKeyExists: jest.fn().mockResolvedValue(true),
      getStagedObjectSize: jest.fn().mockResolvedValue(100),
    };
    const metadata = {
      extract: jest
        .fn()
        .mockRejectedValue(
          new MediaMetadataError('MIME_TYPE_MISMATCH', 'MIME mismatch'),
        ),
    };
    const client = { emit: jest.fn() };
    const controller = new PostsWorkerController(
      prisma as never,
      storage as never,
      metadata as never,
      client as never,
      {} as never,
    );

    await controller.handleProcessMedia({
      postId: 'post-id',
      assetIds: ['asset-id'],
    });

    expect(prisma.mediaAsset.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['asset-id'] }, status: 'UPLOAD_PENDING' },
      data: { status: 'FAILED', failureCode: 'MIME_TYPE_MISMATCH' },
    });
    expect(prisma.post.updateMany).toHaveBeenCalledWith({
      where: { id: 'post-id', visibility: 'DRAFT' },
      data: { mediaStatus: 'FAILED' },
    });
    expect(client.emit).not.toHaveBeenCalled();
  });
});
