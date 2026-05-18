import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { CommonModule, RedisModule, envValidationSchema, buildLoggerOptions } from '@baaz/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    LoggerModule.forRoot(buildLoggerOptions('payment-service')),
    RedisModule,
    PrismaModule,
    HealthModule,
    CommonModule,
  ],
})
export class AppModule {}
