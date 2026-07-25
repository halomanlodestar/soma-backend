import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class FollowResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String, { nullable: true })
  message?: string;
}

@ObjectType()
export class FollowStatus {
  @Field(() => Boolean)
  isFollowing: boolean;
}

@ObjectType()
export class FollowUserDto {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  displayName: string | null;

  @Field(() => String)
  role: string;
}
