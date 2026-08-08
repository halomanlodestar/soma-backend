import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import {
  InputType,
  ObjectType,
  Field,
  ID,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import {
  MediaType,
  MediaUploadPurpose,
} from '../../../prisma/generated/client';

registerEnumType(MediaUploadPurpose, { name: 'MediaUploadPurpose' });
registerEnumType(MediaType, { name: 'MediaType' });

@InputType()
export class UploadIntentDto {
  @Field(() => MediaUploadPurpose)
  @IsEnum(MediaUploadPurpose)
  purpose: MediaUploadPurpose;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  somaId?: string;

  @Field(() => MediaType)
  @IsEnum(MediaType)
  @IsNotEmpty()
  mediaType: MediaType;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  byteSize: number;
}

@ObjectType()
export class UploadIntentResponseDto {
  @Field(() => ID)
  assetId: string;

  @Field(() => String)
  presignedUploadUrl: string;

  @Field(() => String)
  key: string;
}
