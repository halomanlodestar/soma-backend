import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({
    description: 'Updated title of the post',
    example: 'The Future of AI in 2025 - Updated',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Updated body/content of the post',
    example: 'Here are my updated thoughts...',
    required: false,
  })
  @IsString()
  @IsOptional()
  body?: string;
}
