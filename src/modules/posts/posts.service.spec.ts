import { PostsService } from './posts.service';
import { UnauthorizedError } from '../../common/errors/graphql-errors';

describe('PostsService', () => {
  let service: PostsService;
  const prisma = {
    soma: { findUnique: jest.fn() },
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    mediaAsset: { findMany: jest.fn() },
  };
  const client = { emit: jest.fn() };
  const membershipsService = { getActivePublishingMembership: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PostsService(
      prisma as never,
      client as never,
      membershipsService as never,
    );
  });

  it('requires an active creator membership in the target Soma', async () => {
    prisma.soma.findUnique.mockResolvedValue({ id: 'soma-id' });
    membershipsService.getActivePublishingMembership.mockResolvedValue(null);

    const result = await service.create('user-id', {
      title: 'Draft work',
      somaId: 'soma-id',
    });

    expect(result).toBeInstanceOf(UnauthorizedError);
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it('creates a draft and queues media processing', async () => {
    prisma.soma.findUnique.mockResolvedValue({ id: 'soma-id' });
    membershipsService.getActivePublishingMembership.mockResolvedValue({
      id: 'membership-id',
    });
    prisma.post.create.mockResolvedValue({
      id: 'post-id',
      visibility: 'DRAFT',
    });
    prisma.mediaAsset.findMany.mockResolvedValue([{ id: 'asset-id' }]);

    await service.create('user-id', {
      title: 'Draft work',
      somaId: 'soma-id',
      media: [{ assetId: 'asset-id' }],
    });

    expect(prisma.post.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        visibility: 'DRAFT',
        mediaStatus: 'PENDING',
        creatorMembershipId: 'membership-id',
      }),
    });
    expect(client.emit).toHaveBeenCalledWith('post.process_media', {
      postId: 'post-id',
      assetIds: ['asset-id'],
    });
  });

  it('queues processing for a post without media so it can auto-publish', async () => {
    prisma.soma.findUnique.mockResolvedValue({ id: 'soma-id' });
    membershipsService.getActivePublishingMembership.mockResolvedValue({
      id: 'membership-id',
    });
    prisma.post.create.mockResolvedValue({ id: 'post-id' });

    await service.create('user-id', {
      title: 'Text work',
      somaId: 'soma-id',
    });

    expect(client.emit).toHaveBeenCalledWith('post.process_media', {
      postId: 'post-id',
      assetIds: [],
    });
  });
});
