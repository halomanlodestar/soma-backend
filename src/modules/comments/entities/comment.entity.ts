import { ApiProperty } from '@nestjs/swagger';
import { Comment as PrismaComment } from '../../../prisma/generated/client';

export class Comment implements PrismaComment {
  @ApiProperty({ description: 'Comment UUID' })
  id: string;

  @ApiProperty({ description: 'Content of the comment' })
  content: string;

  @ApiProperty({ description: 'Author UUID' })
  authorId: string;

  @ApiProperty({ description: 'Post UUID' })
  postId: string;

  @ApiProperty({ description: 'Parent Comment UUID', nullable: true })
  parentCommentId: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
