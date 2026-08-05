import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaService: ReturnType<typeof mockPrismaService>;

  const mockPrismaService = () => ({
    notification: {
      upsert: jest.fn(),
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('upserts the inbox notification with the event idempotency key', async () => {
    const event = {
      sourceEventId: 'evt-12345',
      userId: 'usr-67890',
      type: 'NEW_FOLLOWER',
      message: 'You have a new follower',
      postId: 'post-111',
      commentId: undefined,
    };
    const notification = { id: 'notif-1', ...event, createdAt: new Date() };
    prismaService.notification.upsert.mockResolvedValue(notification);

    await expect(service.processCreate(event)).resolves.toEqual(notification);
    expect(prismaService.notification.upsert).toHaveBeenCalledWith({
      where: { sourceEventId: event.sourceEventId },
      create: event,
      update: {},
    });
  });

  it('uses the same key when an event is delivered again', async () => {
    const event = {
      sourceEventId: 'evt-repeated-001',
      userId: 'usr-99999',
      type: 'POST_LIKED',
      message: 'Someone liked your post',
      postId: 'post-222',
      commentId: 'comment-333',
    };
    const notification = { id: 'notif-2', ...event, createdAt: new Date() };
    prismaService.notification.upsert.mockResolvedValue(notification);

    await service.processCreate(event);
    await expect(service.processCreate(event)).resolves.toEqual(notification);
    expect(prismaService.notification.upsert).toHaveBeenCalledTimes(2);
    expect(prismaService.notification.upsert).toHaveBeenLastCalledWith({
      where: { sourceEventId: event.sourceEventId },
      create: event,
      update: {},
    });
  });
});
