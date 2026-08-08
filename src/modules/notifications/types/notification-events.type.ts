export type CreateNotificationEvent = {
  sourceEventId: string;
  recipientId: string;
  actorId?: string;
  eventType: string;
  eventData: Record<string, unknown>;
};
