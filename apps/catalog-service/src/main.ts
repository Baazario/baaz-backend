import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const host = process.env.CATALOG_SERVICE_TCP_HOST ?? '0.0.0.0';
  const port = Number.parseInt(process.env.CATALOG_SERVICE_TCP_PORT ?? '3003', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { host, port },
    bufferLogs: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableShutdownHooks();
  await app.listen();

  new Logger('Bootstrap').log(`catalog-service started on tcp://${host}:${port}`);
}

bootstrap();
