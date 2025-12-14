import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../../../prisma/generated/client';

export class UploadIntentDto {
  @ApiProperty({
    description: 'Type of media to upload',
    enum: ['IMAGE', 'VIDEO', 'AUDIO'],
    example: 'IMAGE',
  })
  @IsEnum(['IMAGE', 'VIDEO', 'AUDIO'])
  @IsNotEmpty()
  mediaType: MediaType;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'Name of the file',
    example: 'photo.jpg',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;
}

export class UploadIntentResponseDto {
  @ApiProperty({
    description: 'Presigned URL for uploading the file',
    example: 'https://bucket.s3.region.amazonaws.com/...',
  })
  presignedUploadUrl: string;

  @ApiProperty({
    description: 'Final public URL of the uploaded file',
    example: 'https://bucket.s3.region.amazonaws.com/soma/user-id/...',
  })
  finalPublicUrl: string;
}
