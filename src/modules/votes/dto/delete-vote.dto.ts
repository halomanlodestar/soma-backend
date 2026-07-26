import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { TargetType } from './create-vote.dto';

@InputType()
export class DeleteVoteDto {
  @Field(() => TargetType)
  @IsEnum(TargetType)
  @IsNotEmpty()
  targetType: TargetType;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  targetId: string;
}
