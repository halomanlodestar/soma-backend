import { Injectable, Logger } from '@nestjs/common';
import ffprobe from '@ffprobe-installer/ffprobe';
import { fileTypeFromFile } from 'file-type';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { MediaType } from '../../prisma/generated/client';
import { StorageService } from './storage/storage.service';

const execFileAsync = promisify(execFile);

export interface MediaMetadata {
  mimeType: string;
  byteSize: number;
  checksum: string;
  metadata: Record<string, string | number>;
}

type FfprobeResult = {
  format?: { format_name?: string; duration?: string; bit_rate?: string };
  streams?: Array<{
    codec_type?: 'video' | 'audio';
    codec_name?: string;
    width?: number;
    height?: number;
    duration?: string;
    bit_rate?: string;
  }>;
};

@Injectable()
export class MediaMetadataService {
  private readonly logger = new Logger(MediaMetadataService.name);

  constructor(private readonly storageService: StorageService) {}

  async extract(input: {
    stagingKey: string;
    expectedType: MediaType;
    declaredMimeType: string;
    expectedByteSize: number;
  }): Promise<MediaMetadata> {
    const directory = await mkdtemp(join(tmpdir(), 'soma-media-'));
    const filePath = join(directory, 'source');

    try {
      const storedByteSize = await this.storageService.getStagedObjectSize(
        input.stagingKey,
      );
      if (storedByteSize !== input.expectedByteSize) {
        throw new MediaMetadataError(
          'BYTE_SIZE_MISMATCH',
          `Expected ${input.expectedByteSize} bytes, found ${storedByteSize}.`,
        );
      }
      const { byteSize, checksum } = await this.downloadAndChecksum(
        input.stagingKey,
        filePath,
      );
      const detected = await fileTypeFromFile(filePath);

      if (!detected) {
        throw new MediaMetadataError(
          'UNSUPPORTED_MEDIA',
          'The uploaded file type could not be determined from its contents.',
        );
      }

      const probe = await this.probe(filePath);
      const actualType = this.getMediaType(detected.mime, probe);
      const mimeType = this.resolveMimeType(detected.mime, actualType);

      if (actualType !== input.expectedType) {
        throw new MediaMetadataError(
          'MEDIA_TYPE_MISMATCH',
          `Expected ${input.expectedType}, found ${actualType}.`,
        );
      }
      if (mimeType !== input.declaredMimeType.toLowerCase()) {
        throw new MediaMetadataError(
          'MIME_TYPE_MISMATCH',
          `Expected ${input.declaredMimeType}, found ${mimeType}.`,
        );
      }

      return {
        mimeType,
        byteSize,
        checksum,
        metadata: this.buildMetadata(probe),
      };
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  private async downloadAndChecksum(
    stagingKey: string,
    filePath: string,
  ): Promise<{ byteSize: number; checksum: string }> {
    const stream = await this.storageService.getStagedObject(stagingKey);
    const checksum = createHash('sha256');
    let byteSize = 0;

    stream.on('data', (chunk: Buffer | Uint8Array | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      byteSize += buffer.length;
      checksum.update(buffer);
    });

    await pipeline(stream, createWriteStream(filePath, { flags: 'wx' }));

    return { byteSize, checksum: checksum.digest('hex') };
  }

  private async probe(filePath: string): Promise<FfprobeResult> {
    try {
      await access(ffprobe.path, constants.X_OK);

      const { stdout } = await execFileAsync(
        ffprobe.path,
        [
          '-v',
          'error',
          '-show_format',
          '-show_streams',
          '-of',
          'json',
          filePath,
        ],
        { timeout: 30_000, maxBuffer: 1024 * 1024 },
      );

      return JSON.parse(stdout) as FfprobeResult;
    } catch (error) {
      this.logger.warn({
        message: 'Media metadata probe failed',
        error: error instanceof Error ? error.message : String(error),
      });

      throw new MediaMetadataError(
        'METADATA_PROBE_FAILED',
        'The uploaded media could not be read.',
      );
    }
  }

  private getMediaType(
    detectedMimeType: string,
    probe: FfprobeResult,
  ): MediaType {
    if (detectedMimeType.startsWith('image/')) {
      return MediaType.IMAGE;
    }
    if (probe.streams?.some((stream) => stream.codec_type === 'video')) {
      return MediaType.VIDEO;
    }
    if (probe.streams?.some((stream) => stream.codec_type === 'audio')) {
      return MediaType.AUDIO;
    }
    throw new MediaMetadataError(
      'UNSUPPORTED_MEDIA',
      'The uploaded file contains no supported media stream.',
    );
  }

  private resolveMimeType(detectedMimeType: string, type: MediaType): string {
    if (detectedMimeType === 'audio/vnd.wave') {
      return 'audio/wav';
    }
    if (detectedMimeType === 'video/mp4' && type === MediaType.AUDIO) {
      return 'audio/mp4';
    }
    return detectedMimeType;
  }

  private buildMetadata(probe: FfprobeResult): Record<string, string | number> {
    const metadata: Record<string, string | number> = {};
    const video = probe.streams?.find(
      (stream) => stream.codec_type === 'video',
    );
    const audio = probe.streams?.find(
      (stream) => stream.codec_type === 'audio',
    );
    const duration =
      this.numberValue(probe.format?.duration) ??
      this.numberValue(video?.duration) ??
      this.numberValue(audio?.duration);
    const bitRate =
      this.numberValue(probe.format?.bit_rate) ??
      this.numberValue(video?.bit_rate) ??
      this.numberValue(audio?.bit_rate);

    if (video?.width) metadata.width = video.width;
    if (video?.height) metadata.height = video.height;
    if (duration !== undefined) metadata.durationSeconds = duration;
    if (bitRate !== undefined) metadata.bitRate = bitRate;
    if (video?.codec_name) metadata.videoCodec = video.codec_name;
    if (audio?.codec_name) metadata.audioCodec = audio.codec_name;
    if (probe.format?.format_name)
      metadata.container = probe.format.format_name;

    return metadata;
  }

  private numberValue(value: string | undefined): number | undefined {
    if (!value) return undefined;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }
}

export class MediaMetadataError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
