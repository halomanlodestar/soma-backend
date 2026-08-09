import { ObjectType, Field, Float, ID, Int } from '@nestjs/graphql';
import { MediaType } from '../../../prisma/generated/client';

@ObjectType()
export class MediaMetadata {
  @Field(() => String, { nullable: true })
  mimeType?: string | null;

  @Field(() => Float, { nullable: true })
  byteSize?: number | null;

  @Field(() => Int, { nullable: true })
  width?: number | null;

  @Field(() => Int, { nullable: true })
  height?: number | null;

  @Field(() => Float, { nullable: true })
  durationSeconds?: number | null;

  @Field(() => Float, { nullable: true })
  bitRate?: number | null;

  @Field(() => String, { nullable: true })
  container?: string | null;

  @Field(() => String, { nullable: true })
  videoCodec?: string | null;

  @Field(() => String, { nullable: true })
  audioCodec?: string | null;
}

@ObjectType()
export class MediaItem {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  collectionId: string;

  @Field(() => String)
  type: MediaType;

  @Field(() => String)
  originalUrl: string;

  @Field(() => MediaMetadata, { nullable: true })
  metadata?: MediaMetadata | null;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class MediaCollection {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  postId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => [MediaItem])
  items: MediaItem[];
}
