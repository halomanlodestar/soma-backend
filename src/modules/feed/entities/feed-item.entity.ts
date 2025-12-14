import { ApiProperty } from '@nestjs/swagger';

class FeedUser {
  @ApiProperty() id: string;
  @ApiProperty() username: string;
  @ApiProperty({ nullable: true }) displayName: string | null;
}

class FeedSoma {
  @ApiProperty() id: string;
  @ApiProperty() slug: string;
  @ApiProperty() name: string;
}

class FeedMediaItem {
  @ApiProperty() type: string; // e.g. IMAGE, VIDEO
  @ApiProperty() originalUrl: string;
}

class FeedMediaCollection {
  @ApiProperty({ type: [FeedMediaItem] }) items: FeedMediaItem[];
}

export class FeedItem {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true }) body: string | null;
  @ApiProperty() createdAt: Date;

  @ApiProperty({ type: FeedUser }) author: FeedUser;
  @ApiProperty({ type: FeedSoma }) soma: FeedSoma;

  @ApiProperty({ type: FeedMediaCollection, nullable: true })
  media: FeedMediaCollection | null;

  @ApiProperty() voteCount: number;
  @ApiProperty() awardCount: number;
}
