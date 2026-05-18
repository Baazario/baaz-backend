import { Controller, Post, Body, Req, Inject, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';
import { AppException, ErrorCode } from '@baaz/common';
import { Public } from '../guards/jwt.guard';
import { AUTH_SERVICE } from '../clients/service-tokens.constant';

@Controller('auth')
export class AuthProxyController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  @Public()
  @Post('register')
  register(@Body() body: unknown) {
    return this.send({ cmd: 'auth.register' }, body);
  }

  @Public()
  @Post('login')
  login(@Body() body: unknown) {
    return this.send({ cmd: 'auth.login' }, body);
  }

  @Public()
  @Post('verify-otp')
  verifyOtp(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.send({ cmd: 'auth.verify_otp' }, { ...body, ipAddress: req.ip });
  }

  // Public because the access token is likely expired when refreshing
  @Public()
  @Post('refresh')
  refresh(@Req() req: Request, @Body() body: Record<string, unknown>) {
    return this.send({ cmd: 'auth.refresh' }, { ...body, ipAddress: req.ip });
  }

  // Public — user may not have a valid access token at logout time
  @Public()
  @Post('logout')
  logout(@Body() body: unknown) {
    return this.send({ cmd: 'auth.logout' }, body);
  }

  @Public()
  @Post('resend-otp')
  resendOtp(@Body() body: unknown) {
    return this.send({ cmd: 'auth.resend_otp' }, body);
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  private async send(pattern: { cmd: string }, payload: unknown) {
    try {
      return await firstValueFrom(this.authClient.send(pattern, payload));
    } catch (err: any) {
      const status: number = err?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const errorCode: ErrorCode = err?.errorCode ?? ErrorCode.INTERNAL_ERROR;
      const message: string = err?.message ?? 'Internal server error';
      throw new AppException(errorCode, message, status);
    }
  }
}
