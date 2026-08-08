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
      recipientId: 'usr-67890',
      actorId: 'usr-11111',
      eventType: 'follow.created.v1',
      eventData: { resource: { type: 'user', id: 'usr-11111' } },
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
      recipientId: 'usr-99999',
      actorId: 'usr-22222',
      eventType: 'post.liked.v1',
      eventData: { resource: { type: 'post', id: 'post-222' } },
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
