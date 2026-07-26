import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserStats } from '../../users/dto/user-response.dto';

@ObjectType()
export class FeedUser {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  displayName: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field(() => String, { nullable: true })
  coverUrl?: string | null;

  @Field(() => Boolean, { defaultValue: false })
  isVerified: boolean;

  @Field(() => UserStats, { nullable: true })
  stats?: UserStats;

  @Field(() => [String], { nullable: 'itemsAndList' })
  awards?: string[];
}

@ObjectType()
export class FeedSoma {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  slug: string;

  @Field(() => String)
  name: string;

  @Field(() => Int, { defaultValue: 0 })
  memberCount: number;

  @Field(() => Int, { defaultValue: 0 })
  weeklyVisitorCount: number;

  @Field(() => String, { nullable: true })
  coverUrl?: string | null;
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

  @Field(() => Int, { defaultValue: 0 })
  commentCount: number;

  @Field(() => String, { nullable: true })
  excerpt?: string | null;

  @Field(() => String, { nullable: true })
  mediaUrl?: string | null;

  @Field(() => Int, { nullable: true })
  userVoteValue?: number;
}
