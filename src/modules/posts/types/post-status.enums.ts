import { registerEnumType } from '@nestjs/graphql';
import {
  MediaProcessingStatus,
  PostVisibility,
} from '../../../prisma/generated/client';

registerEnumType(PostVisibility, { name: 'PostVisibility' });
registerEnumType(MediaProcessingStatus, { name: 'MediaProcessingStatus' });

export { MediaProcessingStatus, PostVisibility };
