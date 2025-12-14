import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class FeedQueryDto {
  @ApiPropertyOptional({
    description: 'Number of posts to return (default: 20)',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Cursor for pagination (Post ID)',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  cursor?: string;
}
