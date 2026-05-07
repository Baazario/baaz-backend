import { Test } from '@nestjs/testing';
import { INestMicroservice } from '@nestjs/common';
import {
  Transport,
  ClientProxy,
  ClientProxyFactory,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AppModule } from '../src/app.module';

const TEST_PORT = 13004;

describe('order-service health (TCP e2e)', () => {
  let app: INestMicroservice;
  let client: ClientProxy;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestMicroservice({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: TEST_PORT },
    });

    await app.listen();

    client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: TEST_PORT },
    });

    await client.connect();
  });

  afterAll(async () => {
    client.close();
    await app.close();
  });

  it('health.check responds with ok or degraded', async () => {
    const result = await firstValueFrom(
      client.send<{ status: string; checks: { db: boolean; redis: boolean }; service: string }>(
        { cmd: 'health.check' },
        {},
      ),
    );

    expect(result).toBeDefined();
    expect(['ok', 'degraded']).toContain(result.status);
    expect(result.checks).toHaveProperty('db');
    expect(result.checks).toHaveProperty('redis');
    expect(result.service).toBe('order-service');
  });
});
