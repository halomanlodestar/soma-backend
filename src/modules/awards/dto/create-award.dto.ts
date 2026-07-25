import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { AwardTargetType } from '../../../prisma/generated/client';

@InputType()
export class CreateAwardDto {
  @Field(() => String)
  @IsEnum(AwardTargetType)
  @IsNotEmpty()
  targetType: AwardTargetType;

  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name: string;
}
