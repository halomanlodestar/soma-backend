import { ApiProperty } from '@nestjs/swagger';

export class Post {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'The Future of AI in 2025' })
  title: string;

  @ApiProperty({
    example: 'Here are my thoughts on AI developments...',
    nullable: true,
  })
  body: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  authorId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  somaId: string;

  @ApiProperty({
    example: 0,
    description: 'Number of times the post has been viewed',
  })
  impressions: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
