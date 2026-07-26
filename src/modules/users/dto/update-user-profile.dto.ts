import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class UpdateUserProfileDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  coverUrl?: string;
}
