import { IsString, IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { InputType, ObjectType, Field } from '@nestjs/graphql';
import { MediaType } from '../../../prisma/generated/client';

@InputType()
export class UploadIntentDto {
  @Field(() => String)
  @IsUUID()
  @IsNotEmpty()
  somaId: string;

  @Field(() => String)
  @IsEnum(['IMAGE', 'VIDEO', 'AUDIO'])
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
}

@ObjectType()
export class UploadIntentResponseDto {
  @Field(() => String)
  presignedUploadUrl: string;

  @Field(() => String)
  finalPublicUrl: string;

  @Field(() => String)
  key: string;
}
