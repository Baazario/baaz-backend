import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { RedisService, AppException, ErrorCode } from '@baaz/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { OtpPurpose, UserStatus } from '../generated/client';

@Injectable()
export class AuthService {
  private readonly OTP_TTL_SECONDS = 300;          // 5 min — OTP validity
  private readonly OTP_LOCK_TTL_SECONDS = 1800;    // 30 min — lockout after max attempts
  private readonly MAX_OTP_ATTEMPTS = 5;            // wrong guesses before lock
  private readonly OTP_SEND_WINDOW_SECONDS = 1800; // 30 min — rate limit window
  private readonly MAX_OTP_SENDS = 3;              // max OTPs per identifier per window

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
  ) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    if (!dto.phone && !dto.email) {
      throw new AppException(ErrorCode.BAD_REQUEST, 'Phone or email is required', 400);
    }

    const orClauses = [
      dto.phone ? { phone: dto.phone } : null,
      dto.email ? { email: dto.email } : null,
    ].filter((c): c is NonNullable<typeof c> => c !== null);

    const existing = await this.prisma.user.findFirst({ where: { OR: orClauses } });
    if (existing) {
      throw new AppException(ErrorCode.CONFLICT, 'User already exists', 409);
    }

    // Rate limit: max 3 OTP sends per identifier per 30 min
    await this.checkOtpSendRateLimit(dto.phone ?? dto.email!);

    const user = await this.prisma.user.create({
      data: { phone: dto.phone, email: dto.email },
    });

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_TTL_SECONDS * 1000);
    const redisKey = `auth:otp:${user.id}:${OtpPurpose.REGISTRATION}`;

    await Promise.all([
      this.redis.set(redisKey, otp, this.OTP_TTL_SECONDS),
      this.prisma.otpCode.create({
        data: { userId: user.id, code: otp, purpose: OtpPurpose.REGISTRATION, expiresAt },
      }),
    ]);

    // Dev: return otp directly. Production: call SMS/email provider and omit otp from response.
    return { userId: user.id, otp, message: 'OTP sent' };
  }

  // ─── Login (returning user) ────────────────────────────────────────────────

  async login(dto: LoginDto) {
    if (!dto.phone && !dto.email) {
      throw new AppException(ErrorCode.BAD_REQUEST, 'Phone or email is required', 400);
    }

    const orClauses = [
      dto.phone ? { phone: dto.phone } : null,
      dto.email ? { email: dto.email } : null,
    ].filter((c): c is NonNullable<typeof c> => c !== null);

    const user = await this.prisma.user.findFirst({ where: { OR: orClauses } });
    if (!user) {
      throw new AppException(ErrorCode.NOT_FOUND, 'No account found with this phone or email', 404);
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new AppException(ErrorCode.FORBIDDEN, 'Account suspended', 403);
    }

    // Rate limit: max 3 OTP sends per identifier per 30 min
    await this.checkOtpSendRateLimit(dto.phone ?? dto.email!);

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_TTL_SECONDS * 1000);
    const redisKey = `auth:otp:${user.id}:${OtpPurpose.LOGIN}`;

    await Promise.all([
      this.redis.set(redisKey, otp, this.OTP_TTL_SECONDS),
      this.prisma.otpCode.create({
        data: { userId: user.id, code: otp, purpose: OtpPurpose.LOGIN, expiresAt },
      }),
    ]);

    return { userId: user.id, otp, message: 'OTP sent' };
  }

  // ─── Verify OTP ───────────────────────────────────────────────────────────

  async verifyOtp(dto: VerifyOtpDto) {
    const { userId, otp, purpose, ipAddress } = dto;
    const redisKey = `auth:otp:${userId}:${purpose}`;
    const lockKey = `auth:otp:lock:${userId}:${purpose}`;
    const attemptsKey = `auth:otp:attempts:${userId}:${purpose}`;

    // Check if this userId+purpose is locked out from too many wrong attempts
    const isLocked = await this.redis.exists(lockKey);
    if (isLocked) {
      throw new AppException(
        ErrorCode.TOO_MANY_REQUESTS,
        'Too many failed attempts. Try again in 30 minutes.',
        429,
      );
    }

    const storedOtp = await this.redis.get(redisKey);
    if (!storedOtp) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'OTP expired or not found', 401);
    }

    if (storedOtp !== otp) {
      // Increment attempt counter (key expires with the OTP window)
      const attempts = await this.redis.incr(attemptsKey);
      await this.redis.expire(attemptsKey, this.OTP_TTL_SECONDS);

      if (attempts >= this.MAX_OTP_ATTEMPTS) {
        // Lock the userId+purpose and invalidate the OTP
        await Promise.all([
          this.redis.set(lockKey, '1', this.OTP_LOCK_TTL_SECONDS),
          this.redis.del(redisKey),
          this.redis.del(attemptsKey),
        ]);
        throw new AppException(
          ErrorCode.UNAUTHORIZED,
          'Too many failed attempts. Account locked for 30 minutes.',
          401,
        );
      }

      const remaining = this.MAX_OTP_ATTEMPTS - attempts;
      throw new AppException(
        ErrorCode.UNAUTHORIZED,
        `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        401,
      );
    }

    // Valid OTP — delete from Redis immediately (single use) + clear attempt counter
    await Promise.all([
      this.redis.del(redisKey),
      this.redis.del(attemptsKey),
    ]);

    // Activate user + mark OTP used atomically
    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE },
      }),
      this.prisma.otpCode.updateMany({
        where: { userId, purpose, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    const accessToken = this.jwt.sign({
      sub: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    });

    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = createHash('sha256').update(dto.refreshToken).digest('hex');

    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Invalid refresh token', 401);
    }
    if (stored.revokedAt) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Refresh token has been revoked', 401);
    }
    if (stored.expiresAt < new Date()) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Refresh token expired', 401);
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'User not found or inactive', 401);
    }

    // Rotate: revoke old token, issue new one
    const rawNewToken = randomBytes(32).toString('hex');
    const newTokenHash = createHash('sha256').update(rawNewToken).digest('hex');

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newTokenHash,
          ipAddress: dto.ipAddress,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const accessToken = this.jwt.sign({
      sub: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    });

    return { accessToken, refreshToken: rawNewToken };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(dto: LogoutDto) {
    const tokenHash = createHash('sha256').update(dto.refreshToken).digest('hex');

    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    // Idempotent — already revoked or doesn't exist
    if (!stored || stored.revokedAt) {
      return { message: 'Logged out' };
    }

    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logged out' };
  }

  // ─── Resend OTP ───────────────────────────────────────────────────────────

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new AppException(ErrorCode.NOT_FOUND, 'User not found', 404);
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new AppException(ErrorCode.FORBIDDEN, 'Account suspended', 403);
    }

    // Rate limit by phone or email
    await this.checkOtpSendRateLimit(user.phone ?? user.email!);

    const redisKey = `auth:otp:${user.id}:${dto.purpose}`;
    const lockKey = `auth:otp:lock:${user.id}:${dto.purpose}`;
    const attemptsKey = `auth:otp:attempts:${user.id}:${dto.purpose}`;

    // Clear old OTP, lock, and attempt counter so user gets a fresh start
    await Promise.all([
      this.redis.del(redisKey),
      this.redis.del(lockKey),
      this.redis.del(attemptsKey),
    ]);

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_TTL_SECONDS * 1000);

    await Promise.all([
      this.redis.set(redisKey, otp, this.OTP_TTL_SECONDS),
      this.prisma.otpCode.create({
        data: { userId: user.id, code: otp, purpose: dto.purpose, expiresAt },
      }),
    ]);

    return { userId: user.id, otp, message: 'OTP resent' };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100_000 + Math.random() * 900_000).toString();
  }

  /**
   * Enforces max 3 OTP sends per phone/email per 30-minute window.
   * Uses Redis incr so the first call sets the counter; expire is set on first increment.
   */
  private async checkOtpSendRateLimit(identifier: string): Promise<void> {
    const key = `auth:otp-send:${identifier}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, this.OTP_SEND_WINDOW_SECONDS);
    }
    if (count > this.MAX_OTP_SENDS) {
      throw new AppException(
        ErrorCode.TOO_MANY_REQUESTS,
        'Too many OTP requests. Try again in 30 minutes.',
        429,
      );
    }
  }
}
