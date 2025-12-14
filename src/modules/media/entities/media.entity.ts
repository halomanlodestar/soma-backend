import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../../../prisma/generated/client';

export class MediaItem {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  collectionId: string;

  @ApiProperty({ enum: ['IMAGE', 'VIDEO', 'AUDIO'], example: 'IMAGE' })
  type: MediaType;

  @ApiProperty({
    example: 'https://bucket.s3.region.amazonaws.com/soma/user-id/...',
  })
  originalUrl: string;

  @ApiProperty({ nullable: true, example: { width: 1920, height: 1080 } })
  metadata: Record<string, any> | null;

  @ApiProperty()
  createdAt: Date;
}

export class MediaCollection {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  postId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [MediaItem] })
  items: MediaItem[];
}
