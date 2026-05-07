import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('ApiGateway');
  const app = await NestFactory.create(AppModule);

  // Validation — strip unknown fields, auto-transform primitives
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // CORS — tighten origins via env in production
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Health routes are outside the versioned prefix so k8s probes stay simple
  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/health/liveness', '/health/readiness', '/health/services', '/health/services/:service'],
  });

  const port = process.env.API_GATEWAY_PORT ?? 3000;
  await app.listen(port);

  logger.log(`API Gateway        → http://localhost:${port}/api/v1`);
  logger.log(`Health (full)      → http://localhost:${port}/health`);
  logger.log(`Health (liveness)  → http://localhost:${port}/health/liveness`);
  logger.log(`Health (readiness) → http://localhost:${port}/health/readiness`);
}

bootstrap();
