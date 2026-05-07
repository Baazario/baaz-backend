import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { HealthController } from './health.controller';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
          lazyConnect: true,
          enableOfflineQueue: false,
        }),
    },
  ],
  controllers: [HealthController],
})
export class HealthModule {}
