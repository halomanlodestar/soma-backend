import z from 'zod';

export const configSchema = z.object({
  DATABASE_URL: z.string(),
  PORT: z
    .string()
    .optional()
    .default('3000')
    .transform((val) => parseInt(val, 10)),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters long'),
  REFRESH_TOKEN_HMAC_SECRET: z
    .string()
    .min(32, 'REFRESH_TOKEN_HMAC_SECRET must be at least 32 characters long'),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  // Legacy S3-compatible fallback. Prefer the explicit B2 values below.
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  B2_REGION: z.string().optional(),
  B2_KEY_ID: z.string().optional(),
  B2_APPLICATION_KEY: z.string().optional(),
  B2_S3_ENDPOINT: z.string().url().optional(),
  B2_STAGING_BUCKET: z.string().optional(),
  B2_PUBLIC_BUCKET: z.string().optional(),
  MEDIA_DELIVERY_ORIGIN: z.string().url().optional(),
  MEDIA_UPLOAD_URL_TTL_SECONDS: z
    .string()
    .optional()
    .default('600')
    .transform((val) => parseInt(val, 10)),
  FRONTEND_URL: z.string().default('http://localhost:8000'),
  // Prefer a complete Redis URI in production, e.g.
  // rediss://default:password@redis.example.com:6379
  REDIS_URL: z.string().min(1).optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .optional()
    .default('6379')
    .transform((val) => parseInt(val, 10)),
});
