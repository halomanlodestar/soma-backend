import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { InputType, Field, registerEnumType } from '@nestjs/graphql';

export enum AwardTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
}
registerEnumType(AwardTargetType, { name: 'AwardTargetType' });

@InputType()
export class CreateAwardDto {
  @Field(() => AwardTargetType)
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
