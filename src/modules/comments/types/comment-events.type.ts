export type CreateCommentEvent = {
  commandId: string;
  userId: string;
  postId?: string;
  content: string;
  parentCommentId?: string;
};
