export type CreateNotificationEvent = {
  sourceEventId: string;
  userId: string;
  type: string;
  message: string;
  postId?: string;
  commentId?: string;
};
