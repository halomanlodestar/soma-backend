import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class FeedUser {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  displayName: string | null;
}

@ObjectType()
export class FeedSoma {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  slug: string;

  @Field(() => String)
  name: string;
}

@ObjectType()
export class FeedMediaItem {
  @Field(() => String)
  type: string;

  @Field(() => String)
  originalUrl: string;
}

@ObjectType()
export class FeedMediaCollection {
  @Field(() => [FeedMediaItem])
  items: FeedMediaItem[];
}

@ObjectType()
export class FeedItem {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  body: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => FeedUser)
  author: FeedUser;

  @Field(() => FeedSoma)
  soma: FeedSoma;

  @Field(() => FeedMediaCollection, { nullable: true })
  media: FeedMediaCollection | null;

  @Field(() => Int)
  voteCount: number;

  @Field(() => Int)
  awardCount: number;
}
