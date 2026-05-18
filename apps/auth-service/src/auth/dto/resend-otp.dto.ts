import { IsEnum, IsUUID } from 'class-validator';
import { OtpPurpose } from '../../generated/client';

export class ResendOtpDto {
  @IsUUID()
  userId: string;

  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
