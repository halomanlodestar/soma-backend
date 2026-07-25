import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

@ArgsType()
export class FeedQueryDto {
  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsUUID()
  cursor?: string;
}
