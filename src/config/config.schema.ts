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
  JWT_EXPIRATION: z.string().optional().default('7d'),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string(),
  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});
