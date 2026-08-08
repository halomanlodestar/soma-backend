import { BadRequestException } from '@nestjs/common';
import {
  MediaType,
  MediaUploadPurpose,
} from '../../../prisma/generated/client';

type UploadPolicy = {
  allowedTypes: MediaType[];
  allowedMimeTypes: string[];
  maxBytes: number;
  requiresSomaMembership: boolean;
};

const MB = 1024 * 1024;

const UPLOAD_POLICIES: Record<MediaUploadPurpose, UploadPolicy> = {
  PROFILE_AVATAR: {
    allowedTypes: [MediaType.IMAGE],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 10 * MB,
    requiresSomaMembership: false,
  },
  PROFILE_BANNER: {
    allowedTypes: [MediaType.IMAGE],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 15 * MB,
    requiresSomaMembership: false,
  },
  POST_MEDIA: {
    allowedTypes: [MediaType.IMAGE, MediaType.VIDEO, MediaType.AUDIO],
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
    ],
    maxBytes: 500 * MB,
    requiresSomaMembership: true,
  },
};

export function validateUploadIntent(input: {
  purpose: MediaUploadPurpose;
  mediaType: MediaType;
  mimeType: string;
  byteSize: number;
  somaId?: string;
}): UploadPolicy {
  const policy = UPLOAD_POLICIES[input.purpose];

  if (!policy.allowedTypes.includes(input.mediaType)) {
    throw new BadRequestException(
      `${input.purpose} does not accept ${input.mediaType} media.`,
    );
  }

  if (!policy.allowedMimeTypes.includes(input.mimeType.toLowerCase())) {
    throw new BadRequestException(
      `${input.mimeType} is not allowed for ${input.purpose}.`,
    );
  }

  if (input.byteSize > policy.maxBytes) {
    throw new BadRequestException(
      `File exceeds the ${policy.maxBytes} byte limit.`,
    );
  }

  if (policy.requiresSomaMembership && !input.somaId) {
    throw new BadRequestException('A Soma is required for post media.');
  }

  if (!policy.requiresSomaMembership && input.somaId) {
    throw new BadRequestException(
      'A Soma cannot be supplied for profile media.',
    );
  }

  return policy;
}
