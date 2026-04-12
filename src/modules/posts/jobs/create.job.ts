import { CreateMediaItemDto } from '../dto/create-media-item.dto';

export interface CreatePostJob {
  postId: string;
  media?: CreateMediaItemDto[];
}
