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
  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:8000'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .optional()
    .default('6379')
    .transform((val) => parseInt(val, 10)),
});
