import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  NotFound,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PresignedUploadResult } from '../types/media.types';

@Injectable()
export class StorageService {
  private readonly privateS3Client: S3Client;
  private readonly publicS3Client: S3Client;
  private readonly privateBucket: string;
  private readonly publicBucket: string;
  private readonly publicAssetBaseUrl: string;
  private readonly uploadUrlTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.privateBucket = this.configService.getOrThrow<string>('S3_BUCKET');
    this.publicBucket =
      this.configService.getOrThrow<string>('PUBLIC_S3_BUCKET');
    this.publicAssetBaseUrl = this.configService
      .getOrThrow<string>('PUBLIC_ASSET_BASE_URL')
      .replace(/\/+$/, '');
    this.uploadUrlTtlSeconds = this.configService.getOrThrow<number>(
      'MEDIA_UPLOAD_URL_TTL_SECONDS',
    );

    this.privateS3Client = new S3Client({
      region: this.configService.getOrThrow<string>('S3_REGION'),
      endpoint: this.configService.getOrThrow<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'S3_SECRET_ACCESS_KEY',
        ),
      },
    });

    this.publicS3Client = new S3Client({
      region: this.configService.getOrThrow<string>('PUBLIC_S3_REGION'),
      endpoint: this.configService.getOrThrow<string>('PUBLIC_S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>(
          'PUBLIC_S3_ACCESS_KEY_ID',
        ),
        secretAccessKey: this.configService.getOrThrow<string>(
          'PUBLIC_S3_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async generatePresignedUploadUrl(
    userId: string,
    assetId: string,
    fileName: string,
    mimeType: string,
  ): Promise<PresignedUploadResult> {
    const extension = this.getExtensionFromFileName(fileName);
    const key = `staging/${userId}/${assetId}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.privateBucket,
      Key: key,
      ContentType: mimeType,
    });

    const presignedUploadUrl = await getSignedUrl(
      this.privateS3Client,
      command,
      {
        expiresIn: this.uploadUrlTtlSeconds,
      },
    );

    return {
      presignedUploadUrl,
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

  getPublishedKey(stagingKey: string): string {
    return `published/${stagingKey.replace(/^staging\//, '')}`;
  }

  async verifyKeyExists(key: string): Promise<boolean> {
    try {
      await this.privateS3Client.send(
        new HeadObjectCommand({ Bucket: this.privateBucket, Key: key }),
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
    const stagedObject = await this.privateS3Client.send(
      new GetObjectCommand({ Bucket: this.privateBucket, Key: stagingKey }),
    );

    if (!stagedObject.Body) {
      throw new Error(`Storage object ${stagingKey} has no body`);
    }

    await this.publicS3Client.send(
      new PutObjectCommand({
        Bucket: this.publicBucket,
        Key: publishedKey,
        Body: stagedObject.Body,
        ContentType: stagedObject.ContentType,
        ContentLength: stagedObject.ContentLength,
      }),
    );

    return publishedKey;
  }

  async deleteStagedObject(key: string): Promise<void> {
    await this.privateS3Client.send(
      new DeleteObjectCommand({ Bucket: this.privateBucket, Key: key }),
    );
  }

  async deletePublishedObject(key: string): Promise<void> {
    await this.publicS3Client.send(
      new DeleteObjectCommand({ Bucket: this.publicBucket, Key: key }),
    );
  }

  buildPublicUrl(key: string): string {
    return `${this.publicAssetBaseUrl}/${key}`;
  }
}
