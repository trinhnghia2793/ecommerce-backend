import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { THROTTLER_CONFIG } from './throttler.config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      // imports: [ConfigModule], // no longer imports because ConfigModule is set global = true (go see at app.module.ts)
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cfg = config.getOrThrow<{ ttl: number; limit: number }>(
          THROTTLER_CONFIG,
        );

        return {
          throttlers: [
            {
              name: 'default',
              ttl: cfg.ttl,
              limit: cfg.limit,
            },
          ],
        };
      },
    }),
  ],
  exports: [ThrottlerModule],
})
export class AppThrottlerModule {}
