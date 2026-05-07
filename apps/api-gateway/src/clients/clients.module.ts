import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  CATALOG_SERVICE,
  LOGISTICS_SERVICE,
  NOTIFICATION_SERVICE,
  ORDER_SERVICE,
  PAYMENT_SERVICE,
  SELLER_SERVICE,
} from './service-tokens.constant';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('AUTH_SERVICE_TCP_HOST', 'localhost'),
            port: config.get<number>('AUTH_SERVICE_TCP_PORT', 3001),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: SELLER_SERVICE,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('SELLER_SERVICE_TCP_HOST', 'localhost'),
            port: config.get<number>('SELLER_SERVICE_TCP_PORT', 3002),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: CATALOG_SERVICE,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('CATALOG_SERVICE_TCP_HOST', 'localhost'),
            port: config.get<number>('CATALOG_SERVICE_TCP_PORT', 3003),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: ORDER_SERVICE,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('ORDER_SERVICE_TCP_HOST', 'localhost'),
            port: config.get<number>('ORDER_SERVICE_TCP_PORT', 3004),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: PAYMENT_SERVICE,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('PAYMENT_SERVICE_TCP_HOST', 'localhost'),
            port: config.get<number>('PAYMENT_SERVICE_TCP_PORT', 3005),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: LOGISTICS_SERVICE,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('LOGISTICS_SERVICE_TCP_HOST', 'localhost'),
            port: config.get<number>('LOGISTICS_SERVICE_TCP_PORT', 3006),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: NOTIFICATION_SERVICE,
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('NOTIFICATION_SERVICE_TCP_HOST', 'localhost'),
            port: config.get<number>('NOTIFICATION_SERVICE_TCP_PORT', 3007),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class ServiceClientsModule {}
