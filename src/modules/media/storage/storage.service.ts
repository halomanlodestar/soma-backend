import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { Readable } from 'node:stream';
import type { PresignedUploadResult } from '../types/media.types';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly privateClient: Client;
  private readonly publicClient: Client;
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

    this.privateClient = this.createClient({
      endpointKey: 'S3_ENDPOINT',
      accessKeyIdKey: 'S3_ACCESS_KEY_ID',
      secretAccessKeyKey: 'S3_SECRET_ACCESS_KEY',
    });
    this.publicClient = this.createClient({
      endpointKey: 'PUBLIC_S3_ENDPOINT',
      accessKeyIdKey: 'PUBLIC_S3_ACCESS_KEY_ID',
      secretAccessKeyKey: 'PUBLIC_S3_SECRET_ACCESS_KEY',
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
    const presignedUploadUrl = await this.privateClient.presignedPutObject(
      this.privateBucket,
      key,
      this.uploadUrlTtlSeconds,
    );

    return { presignedUploadUrl, key };
  }

  private createClient(config: {
    endpointKey: string;
    accessKeyIdKey: string;
    secretAccessKeyKey: string;
  }): Client {
    const endpoint = new URL(
      this.configService.getOrThrow<string>(config.endpointKey),
    );

    if (endpoint.protocol !== 'https:' && endpoint.protocol !== 'http:') {
      throw new Error(`Unsupported S3 endpoint protocol: ${endpoint.protocol}`);
    }

    return new Client({
      endPoint: endpoint.hostname,
      ...(endpoint.port ? { port: Number(endpoint.port) } : {}),
      useSSL: endpoint.protocol === 'https:',
      accessKey: this.configService.getOrThrow<string>(config.accessKeyIdKey),
      secretKey: this.configService.getOrThrow<string>(
        config.secretAccessKeyKey,
      ),
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
      await this.privateClient.statObject(this.privateBucket, key);
      return true;
    } catch (error) {
      if (this.isMissingObjectError(error)) return false;
      throw error;
    }
  }

  async publishStagedObject(stagingKey: string): Promise<string> {
    const publishedKey = this.getPublishedKey(stagingKey);
    let stagedObject;

    try {
      stagedObject = await this.privateClient.statObject(
        this.privateBucket,
        stagingKey,
      );
    } catch (error) {
      this.logStorageFailure('stat staged object for publication', error, {
        bucket: this.privateBucket,
        key: stagingKey,
      });
      throw error;
    }

    let stagedStream: Readable;
    try {
      stagedStream = await this.privateClient.getObject(
        this.privateBucket,
        stagingKey,
      );
    } catch (error) {
      this.logStorageFailure('get staged object for publication', error, {
        bucket: this.privateBucket,
        key: stagingKey,
      });

      throw error;
    }

    let body: Buffer;

    try {
      body = await this.readStream(stagedStream);
    } catch (error) {
      this.logStorageFailure('read staged object for publication', error, {
        bucket: this.privateBucket,
        key: stagingKey,
      });

      throw error;
    }

    const contentType = stagedObject.metaData['content-type'];

    try {
      await this.publicClient.putObject(
        this.publicBucket,
        publishedKey,
        body,
        body.length,
        contentType ? { 'Content-Type': contentType } : undefined,
      );
    } catch (error) {
      this.logStorageFailure('put published object', error, {
        bucket: this.publicBucket,
        key: publishedKey,
        sourceBucket: this.privateBucket,
        sourceKey: stagingKey,
        contentLength: body.length,
        contentType,
      });

      throw error;
    }

    return publishedKey;
  }

  async deleteStagedObject(key: string): Promise<void> {
    await this.privateClient.removeObject(this.privateBucket, key);
  }

  async deletePublishedObject(key: string): Promise<void> {
    await this.publicClient.removeObject(this.publicBucket, key);
  }

  buildPublicUrl(key: string): string {
    return `${this.publicAssetBaseUrl}/${key}`;
  }

  private readStream(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer | Uint8Array | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      stream.once('error', reject);
      stream.once('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private isMissingObjectError(error: unknown): boolean {
    const code = (error as { code?: string }).code;
    return code === 'NoSuchKey' || code === 'NotFound';
  }

  private logStorageFailure(
    operation: string,
    error: unknown,
    context: Record<string, string | number | undefined>,
  ): void {
    const storageError = error as {
      name?: string;
      code?: string;
      statusCode?: number;
      requestid?: string;
      hostid?: string;
    };

    this.logger.error({
      message: `Storage ${operation} failed`,
      ...context,
      errorName: storageError.name,
      errorCode: storageError.code,
      httpStatusCode: storageError.statusCode,
      requestId: storageError.requestid,
      extendedRequestId: storageError.hostid,
    });
  }
}
