import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RedisService } from '@baaz/common';
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
    private readonly redis: RedisService,
  ) {}

  @MessagePattern({ cmd: 'health.check' })
  async check(): Promise<HealthResponse> {
    const [db, redis] = await Promise.all([this.checkDb(), this.redis.ping()]);
    return {
      status: db && redis ? 'ok' : 'degraded',
      checks: { db, redis },
      service: 'seller-service',
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
}
