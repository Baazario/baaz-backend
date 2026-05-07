import { Module } from '@nestjs/common';
import { ServiceClientsModule } from '../clients/clients.module';
import { HealthProxyController } from './health-proxy.controller';

@Module({
  imports: [ServiceClientsModule],
  controllers: [HealthProxyController],
})
export class HealthProxyModule {}
