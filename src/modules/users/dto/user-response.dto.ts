import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class UserStats {
  @Field(() => Int)
  posts: number;

  @Field(() => Int)
  comments: number;

  @Field(() => Int)
  followers: number;

  @Field(() => Int)
  following: number;
}

@ObjectType()
export class UserResponseDto {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  displayName: string | null;

  @Field(() => String, { nullable: true })
  bio: string | null;

  @Field(() => String)
  role: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  avatarUrl: string | null;

  @Field(() => String, { nullable: true })
  coverUrl: string | null;

  @Field(() => Boolean)
  isVerified: boolean;

  @Field(() => UserStats, { nullable: true })
  stats?: UserStats;

  @Field(() => [String], { nullable: 'itemsAndList' })
  awards?: string[];
}
