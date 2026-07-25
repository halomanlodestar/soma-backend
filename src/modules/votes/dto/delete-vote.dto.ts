import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { VoteTargetType } from '../../../prisma/generated/client';

@InputType()
export class DeleteVoteDto {
  @Field(() => String)
  @IsEnum(VoteTargetType)
  @IsNotEmpty()
  targetType: VoteTargetType;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  targetId: string;
}
