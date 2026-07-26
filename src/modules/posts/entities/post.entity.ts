import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { Soma } from '../../soma/entities/soma.entity';

@ObjectType()
export class Post {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  body: string | null;

  @Field(() => String)
  authorId: string;

  @Field(() => UserResponseDto)
  author?: UserResponseDto;

  @Field(() => String)
  somaId: string;

  @Field(() => Soma)
  soma?: Soma;

  @Field(() => Int, { defaultValue: 0 })
  voteCount: number;

  @Field(() => Int, { defaultValue: 0 })
  commentCount: number;

  @Field(() => String, { nullable: true })
  excerpt?: string | null;

  @Field(() => String, { nullable: true })
  mediaUrl?: string | null;

  @Field(() => Int)
  impressions: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Int, { nullable: true })
  userVoteValue?: number;
}
