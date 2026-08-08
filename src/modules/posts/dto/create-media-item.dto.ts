import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateMediaItemDto {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  assetId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  altText?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  caption?: string;
}
