import { ApiProperty } from '@nestjs/swagger';

export class Soma {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'tech-news' })
  slug: string;

  @ApiProperty({ example: 'Technology News' })
  name: string;

  @ApiProperty({
    example: 'A community for discussing the latest in technology',
    nullable: true,
  })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
