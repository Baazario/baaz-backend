import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { OtpPurpose } from '../../generated/client';

export class VerifyOtpDto {
  @IsUUID()
  userId: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be 6 digits' })
  otp: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
