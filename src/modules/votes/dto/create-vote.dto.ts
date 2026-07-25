import { IsEnum, IsInt, IsNotEmpty, IsUUID, IsIn } from 'class-validator';
import { InputType, Field, Int } from '@nestjs/graphql';
import { VoteTargetType } from '../../../prisma/generated/client';

@InputType()
export class CreateVoteDto {
  @Field(() => String)
  @IsEnum(VoteTargetType)
  @IsNotEmpty()
  targetType: VoteTargetType;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @Field(() => Int)
  @IsInt()
  @IsIn([1, -1])
  @IsNotEmpty()
  value: number;
}
