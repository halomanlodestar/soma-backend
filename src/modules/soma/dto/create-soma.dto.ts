import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSomaDto {
  @ApiProperty({
    description: 'Name of the soma',
    example: 'Technology News',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description:
      'URL-safe slug for the soma (lowercase, alphanumeric and hyphens only)',
    example: 'tech-news',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'Slug must be lowercase and URL-safe (only letters, numbers, and hyphens)',
  })
  slug: string;

  @ApiProperty({
    description: 'Description of the soma',
    example: 'A community for discussing the latest in technology',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
