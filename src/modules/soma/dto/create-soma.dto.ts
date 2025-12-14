import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class CreateSomaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'Slug must be lowercase and URL-safe (only letters, numbers, and hyphens)',
  })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;
}
