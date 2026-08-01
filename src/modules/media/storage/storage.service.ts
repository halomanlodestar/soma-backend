import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  NotFound,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import type { PresignedUploadResult } from '../types/media.types';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly stagingBucket: string;
  private readonly publicBucket: string;
  private readonly deliveryOrigin: string;
  private readonly region: string;
  private readonly uploadUrlTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    const legacyBucket = this.configService.get<string>('S3_BUCKET');
    this.stagingBucket =
      this.configService.get<string>('B2_STAGING_BUCKET') ??
      this.requireStorageValue(legacyBucket, 'B2_STAGING_BUCKET');
    this.publicBucket =
      this.configService.get<string>('B2_PUBLIC_BUCKET') ??
      this.requireStorageValue(legacyBucket, 'B2_PUBLIC_BUCKET');
    this.region =
      this.configService.get<string>('B2_REGION') ??
      this.requireStorageValue(
        this.configService.get<string>('S3_REGION'),
        'B2_REGION',
      );
    this.uploadUrlTtlSeconds = this.configService.getOrThrow<number>(
      'MEDIA_UPLOAD_URL_TTL_SECONDS',
    );

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.configService.get<string>('B2_S3_ENDPOINT'),
      credentials: {
        accessKeyId:
          this.configService.get<string>('B2_KEY_ID') ??
          this.requireStorageValue(
            this.configService.get<string>('S3_ACCESS_KEY_ID'),
            'B2_KEY_ID',
          ),
        secretAccessKey:
          this.configService.get<string>('B2_APPLICATION_KEY') ??
          this.requireStorageValue(
            this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
            'B2_APPLICATION_KEY',
          ),
      },
    });
    this.deliveryOrigin =
      this.configService.get<string>('MEDIA_DELIVERY_ORIGIN') ??
      `https://${this.publicBucket}.s3.${this.region}.amazonaws.com`;
  }

  async generatePresignedUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string,
  ): Promise<PresignedUploadResult> {
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    const extension = this.getExtensionFromFileName(fileName);
    const key = `staging/${userId}/${timestamp}-${random}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.stagingBucket,
      Key: key,
      ContentType: mimeType,
    });

    const presignedUploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.uploadUrlTtlSeconds,
    });

    const finalPublicUrl = this.buildPublicUrl(this.getPublishedKey(key));

    return {
      presignedUploadUrl,
      finalPublicUrl,
      key,
    };
  }

  private getExtensionFromFileName(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }

  isOwnedStagingKey(userId: string, key: string): boolean {
    return key.startsWith(`staging/${userId}/`);
  }

  private requireStorageValue(
    value: string | undefined,
    preferredName: string,
  ): string {
    if (!value) {
      throw new Error(
        `Missing ${preferredName}; configure the B2 storage variables or the legacy S3-compatible fallback.`,
      );
    }
    return value;
  }

  getPublishedKey(stagingKey: string): string {
    return `published/${stagingKey.replace(/^staging\//, '')}`;
  }

  async verifyKeyExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({ Bucket: this.stagingBucket, Key: key }),
      );
      return true;
    } catch (err) {
      if (err instanceof NotFound) {
        return false;
      }
      throw err;
    }
  }

  async publishStagedObject(stagingKey: string): Promise<string> {
    const publishedKey = this.getPublishedKey(stagingKey);
    await this.s3Client.send(
      new CopyObjectCommand({
        Bucket: this.publicBucket,
        Key: publishedKey,
        CopySource: `${this.stagingBucket}/${encodeURIComponent(stagingKey)}`,
      }),
    );
    return publishedKey;
  }

  async deleteStagedObject(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.stagingBucket, Key: key }),
    );
  }

  async deletePublishedObject(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.publicBucket, Key: key }),
    );
  }

  buildPublicUrl(key: string): string {
    return `${this.deliveryOrigin}/${key}`;
  }
}
