import { Controller, Get, Inject, NotFoundException, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { Public } from '../guards/jwt.guard';
import {
  AUTH_SERVICE,
  CATALOG_SERVICE,
  LOGISTICS_SERVICE,
  NOTIFICATION_SERVICE,
  ORDER_SERVICE,
  PAYMENT_SERVICE,
  SELLER_SERVICE,
} from '../clients/service-tokens.constant';

const SERVICE_MAP: Record<string, string> = {
  auth: AUTH_SERVICE,
  seller: SELLER_SERVICE,
  catalog: CATALOG_SERVICE,
  order: ORDER_SERVICE,
  payment: PAYMENT_SERVICE,
  logistics: LOGISTICS_SERVICE,
  notification: NOTIFICATION_SERVICE,
};

@Public()
@Controller('health')
export class HealthProxyController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(SELLER_SERVICE) private readonly sellerClient: ClientProxy,
    @Inject(CATALOG_SERVICE) private readonly catalogClient: ClientProxy,
    @Inject(ORDER_SERVICE) private readonly orderClient: ClientProxy,
    @Inject(PAYMENT_SERVICE) private readonly paymentClient: ClientProxy,
    @Inject(LOGISTICS_SERVICE) private readonly logisticsClient: ClientProxy,
    @Inject(NOTIFICATION_SERVICE) private readonly notificationClient: ClientProxy,
  ) {}

  @Get('services')
  async checkAll() {
    const clients: Record<string, ClientProxy> = {
      auth: this.authClient,
      seller: this.sellerClient,
      catalog: this.catalogClient,
      order: this.orderClient,
      payment: this.paymentClient,
      logistics: this.logisticsClient,
      notification: this.notificationClient,
    };

    const entries = await Promise.all(
      Object.entries(clients).map(async ([name, client]) => [
        name,
        await this.ping(client, `${name}-service`),
      ]),
    );

    return Object.fromEntries(entries);
  }

  @Get('services/:service')
  async checkOne(@Param('service') service: string) {
    const token = SERVICE_MAP[service];
    if (!token) {
      throw new NotFoundException(
        `Unknown service '${service}'. Valid: ${Object.keys(SERVICE_MAP).join(', ')}`,
      );
    }

    const clientMap: Record<string, ClientProxy> = {
      [AUTH_SERVICE]: this.authClient,
      [SELLER_SERVICE]: this.sellerClient,
      [CATALOG_SERVICE]: this.catalogClient,
      [ORDER_SERVICE]: this.orderClient,
      [PAYMENT_SERVICE]: this.paymentClient,
      [LOGISTICS_SERVICE]: this.logisticsClient,
      [NOTIFICATION_SERVICE]: this.notificationClient,
    };

    return this.ping(clientMap[token], `${service}-service`);
  }

  private async ping(client: ClientProxy, serviceName: string) {
    return firstValueFrom(
      client.send({ cmd: 'health.check' }, {}).pipe(
        timeout(3000),
        catchError(() =>
          of({ status: 'unreachable', service: serviceName, checks: { db: false, redis: false } }),
        ),
      ),
    );
  }
}
