import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import type { PresignedUploadResult } from '../types/media.types';

@Injectable()
export class StorageService {
  private readonly privateStorageClient: Client;
  private readonly publicStorageClient: Client;
  private readonly privateBucket: string;
  private readonly publicBucket: string;
  private readonly publicAssetBaseUrl: string;
  private readonly uploadUrlTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    this.privateBucket = this.configService.getOrThrow<string>('S3_BUCKET');
    this.publicBucket = this.configService.getOrThrow<string>(
      'PUBLIC_S3_BUCKET',
    );
    this.publicAssetBaseUrl = this.configService
      .getOrThrow<string>('PUBLIC_ASSET_BASE_URL')
      .replace(/\/+$/, '');
    this.uploadUrlTtlSeconds = this.configService.getOrThrow<number>(
      'MEDIA_UPLOAD_URL_TTL_SECONDS',
    );

    this.privateStorageClient = this.createClient({
      endpoint: this.configService.getOrThrow<string>('S3_ENDPOINT'),
      region: this.configService.getOrThrow<string>('S3_REGION'),
      accessKey: this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
      secretKey: this.configService.getOrThrow<string>(
        'S3_SECRET_ACCESS_KEY',
      ),
    });
    this.publicStorageClient = this.createClient({
      endpoint: this.configService.getOrThrow<string>('PUBLIC_S3_ENDPOINT'),
      region: this.configService.getOrThrow<string>('PUBLIC_S3_REGION'),
      accessKey: this.configService.getOrThrow<string>(
        'PUBLIC_S3_ACCESS_KEY_ID',
      ),
      secretKey: this.configService.getOrThrow<string>(
        'PUBLIC_S3_SECRET_ACCESS_KEY',
      ),
    });
  }

  async generatePresignedUploadUrl(
    userId: string,
    assetId: string,
    fileName: string,
    _mimeType: string,
  ): Promise<PresignedUploadResult> {
    const extension = this.getExtensionFromFileName(fileName);
    const key = `staging/${userId}/${assetId}${extension}`;
    const presignedUploadUrl = await this.privateStorageClient.presignedPutObject(
      this.privateBucket,
      key,
      this.uploadUrlTtlSeconds,
    );

    return { presignedUploadUrl, key };
  }

  private createClient(config: {
    endpoint: string;
    region: string;
    accessKey: string;
    secretKey: string;
  }): Client {
    const endpoint = new URL(config.endpoint);

    return new Client({
      endPoint: endpoint.hostname,
      port: endpoint.port
        ? Number(endpoint.port)
        : endpoint.protocol === 'https:'
          ? 443
          : 80,
      useSSL: endpoint.protocol === 'https:',
      pathStyle: true,
      region: config.region as never,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
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
      await this.privateStorageClient.statObject(this.privateBucket, key);
      return true;
    } catch (err) {
      if (this.isNotFoundError(err)) return false;
      throw err;
    }
  }

  async publishStagedObject(stagingKey: string): Promise<string> {
    const publishedKey = this.getPublishedKey(stagingKey);

    await this.publicStorageClient.copyObject(
      this.publicBucket,
      publishedKey,
      `/${this.privateBucket}/${stagingKey}`,
    );
    await this.publicStorageClient.statObject(this.publicBucket, publishedKey);

    return publishedKey;
  }

  async deleteStagedObject(key: string): Promise<void> {
    await this.privateStorageClient.removeObject(this.privateBucket, key);
  }

  async deletePublishedObject(key: string): Promise<void> {
    await this.publicStorageClient.removeObject(this.publicBucket, key);
  }

  buildPublicUrl(key: string): string {
    return `${this.publicAssetBaseUrl}/${key}`;
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      ['NoSuchKey', 'NoSuchObject', 'NotFound'].includes(
        String(error.code),
      )
    );
  }
}
