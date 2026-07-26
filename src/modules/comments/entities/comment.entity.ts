import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { Comment as PrismaComment } from '../../../prisma/generated/client';

@ObjectType()
export class Comment implements PrismaComment {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  content: string;

  @Field(() => String)
  authorId: string;

  @Field(() => UserResponseDto)
  author?: UserResponseDto;

  @Field(() => Int)
  voteCount: number;

  @Field(() => String)
  postId: string;

  @Field(() => String, { nullable: true })
  parentCommentId: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Int, { nullable: true })
  userVoteValue?: number;
}
