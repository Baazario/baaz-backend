import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { CommonModule, RedisModule, envValidationSchema, buildLoggerOptions } from '@baaz/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    LoggerModule.forRoot(buildLoggerOptions('auth-service')),
    RedisModule,
    PrismaModule,
    HealthModule,
    CommonModule,
    AuthModule,
  ],
})
export class AppModule {}
