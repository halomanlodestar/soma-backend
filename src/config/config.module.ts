import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configSchema } from './config.schema';
import prismaConfig from './prisma.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validate: (config) => {
        const parsed = configSchema.safeParse(config);

        if (!parsed.success) {
          const formattedErrors = parsed.error.issues
            .map((err) => `${err.path.join('.')} - ${err.message}`)
            .join('; ');
          throw new Error(`Config validation error: ${formattedErrors}`);
        }

        return parsed.data;
      },
      load: [prismaConfig],
    }),
  ],
})
export class ConfigModule {}
