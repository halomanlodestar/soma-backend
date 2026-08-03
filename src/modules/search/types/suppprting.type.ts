export type PostSearchRow = {
  id: string;
  title: string;
  body: string | null;
  excerpt: string | null;
  mediaUrl: string | null;
  authorId: string;
  somaId: string;
  impressions: number;
  visibility: 'PUBLISHED';
  mediaStatus: 'NONE' | 'PENDING' | 'READY' | 'FAILED';
  voteCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  rank: number;
};

export type CountRow = { totalCount: bigint };
