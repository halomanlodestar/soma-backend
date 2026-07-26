import { IsEnum, IsInt, IsNotEmpty, IsUUID, IsIn } from 'class-validator';
import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';

export enum TargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
}

registerEnumType(TargetType, { name: 'TargetType' });

@InputType()
export class CreateVoteDto {
  @Field(() => TargetType)
  @IsEnum(TargetType)
  @IsNotEmpty()
  targetType: TargetType;

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
