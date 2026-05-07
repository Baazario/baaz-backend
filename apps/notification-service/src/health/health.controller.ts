import { Controller, Inject } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
  checks: { db: boolean; redis: boolean };
  service: string;
  timestamp: string;
}

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @MessagePattern({ cmd: 'health.check' })
  async check(): Promise<HealthResponse> {
    const [db, redis] = await Promise.all([this.checkDb(), this.checkRedis()]);
    return {
      status: db && redis ? 'ok' : 'degraded',
      checks: { db, redis },
      service: 'notification-service',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDb(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      return (await this.redis.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
