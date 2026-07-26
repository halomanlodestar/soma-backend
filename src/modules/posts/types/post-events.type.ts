import { CreateMediaItemDto } from '../dto/create-media-item.dto';

export class ProcessMediaEvent {
  postId: string;
  media?: CreateMediaItemDto[];
}

export class DeletePostEvent {
  postId: string;
}
