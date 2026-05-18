import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
