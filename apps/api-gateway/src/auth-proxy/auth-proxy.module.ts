import { Module } from '@nestjs/common';
import { AuthProxyController } from './auth-proxy.controller';
import { ServiceClientsModule } from '../clients/clients.module';

@Module({
  imports: [ServiceClientsModule],
  controllers: [AuthProxyController],
})
export class AuthProxyModule {}
