import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'auth.register' })
  register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern({ cmd: 'auth.login' })
  login(@Payload() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern({ cmd: 'auth.verify_otp' })
  verifyOtp(@Payload() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @MessagePattern({ cmd: 'auth.refresh' })
  refresh(@Payload() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @MessagePattern({ cmd: 'auth.logout' })
  logout(@Payload() dto: LogoutDto) {
    return this.authService.logout(dto);
  }

  @MessagePattern({ cmd: 'auth.resend_otp' })
  resendOtp(@Payload() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }
}
