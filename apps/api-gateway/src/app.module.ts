import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { CommonModule, HealthModule } from '@baaz/common';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ServiceClientsModule } from './clients/clients.module';
import { HealthProxyModule } from './health-proxy/health-proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 100 },
    ]),

    // JWT — secret loaded from env, used by JwtAuthGuard
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-env',
      signOptions: { expiresIn: '1d' },
    }),

    // TCP clients — one ClientProxy per downstream service
    ServiceClientsModule,

    HealthProxyModule,
    CommonModule,
    HealthModule,
  ],
  providers: [
    // Rate limit guard — applied globally to all routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // JWT guard — applied globally; use @Public() to opt out per route
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
