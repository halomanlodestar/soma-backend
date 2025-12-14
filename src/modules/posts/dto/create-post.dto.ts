import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsUUID()
  @IsNotEmpty()
  somaId: string;
}
