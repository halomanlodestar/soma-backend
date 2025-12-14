import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';

export interface PresignedUploadResult {
  presignedUploadUrl: string;
  finalPublicUrl: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');
    this.region = this.configService.getOrThrow<string>('S3_REGION');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'S3_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async generatePresignedUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string,
  ): Promise<PresignedUploadResult> {
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    const extension = this.getExtensionFromFileName(fileName);
    const key = `soma/${userId}/${timestamp}-${random}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const presignedUploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    const finalPublicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

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
}
