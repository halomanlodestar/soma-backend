import { ObjectType, Field, ID } from '@nestjs/graphql';
import { MediaType } from '../../../prisma/generated/client';

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
