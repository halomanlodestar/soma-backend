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
  };
  const client = { emit: jest.fn() };
  const membershipsService = { getActivePublishingMembership: jest.fn() };
  const storageService = { isOwnedStagingKey: jest.fn().mockReturnValue(true) };

  beforeEach(() => {
    jest.resetAllMocks();
    storageService.isOwnedStagingKey.mockReturnValue(true);
    service = new PostsService(
      prisma as never,
      client as never,
      membershipsService as never,
      storageService as never,
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

  it('creates a draft and queues media verification without publishing it', async () => {
    prisma.soma.findUnique.mockResolvedValue({ id: 'soma-id' });
    membershipsService.getActivePublishingMembership.mockResolvedValue({
      id: 'membership-id',
    });
    prisma.post.create.mockResolvedValue({
      id: 'post-id',
      visibility: 'DRAFT',
    });

    await service.create('user-id', {
      title: 'Draft work',
      somaId: 'soma-id',
      media: [{ key: 'staging/user/image.jpg', type: 'IMAGE' }],
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
      media: [{ key: 'staging/user/image.jpg', type: 'IMAGE' }],
    });
  });
});
