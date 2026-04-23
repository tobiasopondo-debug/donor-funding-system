import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpPurpose, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtPayload } from './jwt.strategy';
import {
  LoginDto,
  RegisterDto,
  ResendOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  /** Seeded platform admin skips email OTP (same env as prisma seed). */
  private shouldSkipOtp(email: string): boolean {
    const adminEmail = this.normalizeEmail(
      this.config.get<string>('SEED_ADMIN_EMAIL') ?? 'admin@example.com',
    );
    return this.normalizeEmail(email) === adminEmail;
  }

  private generateOtpCode(): string {
    const n = randomInt(0, 1_000_000);
    return String(n).padStart(6, '0');
  }

  private async invalidatePendingOtpChallenges(
    userId: string,
    purpose: OtpPurpose,
  ) {
    await this.prisma.authOtpChallenge.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  private async createOtpChallengeAndSend(
    userId: string,
    email: string,
    purpose: OtpPurpose,
  ): Promise<{ challengeId: string }> {
    await this.invalidatePendingOtpChallenges(userId, purpose);
    const code = this.generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const row = await this.prisma.authOtpChallenge.create({
      data: {
        userId,
        purpose,
        codeHash,
        expiresAt,
        lastSentAt: new Date(),
      },
    });
    const mailPurpose = purpose === OtpPurpose.REGISTER ? 'REGISTER' : 'LOGIN';
    await this.mail.sendOtpEmail(email, code, mailPurpose);
    return { challengeId: row.id };
  }

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.PLATFORM_ADMIN) {
      throw new BadRequestException('Cannot register as admin');
    }
    const email = this.normalizeEmail(dto.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, role: dto.role, emailVerifiedAt: null },
    });
    try {
      const { challengeId } = await this.createOtpChallengeAndSend(
        user.id,
        email,
        OtpPurpose.REGISTER,
      );
      return {
        requiresOtp: true as const,
        challengeId,
        purpose: 'REGISTER' as const,
      };
    } catch (err) {
      await this.prisma.user
        .delete({ where: { id: user.id } })
        .catch(() => undefined);
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (this.shouldSkipOtp(user.email)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      return this.issueTokens(user.id, user.email, user.role);
    }

    const purpose =
      user.emailVerifiedAt == null ? OtpPurpose.REGISTER : OtpPurpose.LOGIN;
    const { challengeId } = await this.createOtpChallengeAndSend(
      user.id,
      user.email,
      purpose,
    );
    return {
      requiresOtp: true as const,
      challengeId,
      purpose:
        purpose === OtpPurpose.REGISTER
          ? ('REGISTER' as const)
          : ('LOGIN' as const),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const challenge = await this.prisma.authOtpChallenge.findUnique({
      where: { id: dto.challengeId },
      include: { user: true },
    });
    if (!challenge || challenge.consumedAt) {
      throw new UnauthorizedException('Invalid or expired verification');
    }
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Code has expired. Request a new code.');
    }
    const codeOk = await bcrypt.compare(dto.code, challenge.codeHash);
    if (!codeOk) throw new UnauthorizedException('Invalid code');

    await this.prisma.authOtpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    if (challenge.purpose === OtpPurpose.REGISTER) {
      await this.prisma.user.update({
        where: { id: challenge.userId },
        data: { emailVerifiedAt: new Date() },
      });
    }

    await this.prisma.user.update({
      where: { id: challenge.userId },
      data: { lastLoginAt: new Date() },
    });

    const user = challenge.user;
    return this.issueTokens(user.id, user.email, user.role);
  }

  async resendOtp(dto: ResendOtpDto) {
    const challenge = await this.prisma.authOtpChallenge.findUnique({
      where: { id: dto.challengeId },
      include: { user: true },
    });
    if (!challenge || challenge.consumedAt) {
      throw new NotFoundException('Challenge not found or already used');
    }
    if (this.shouldSkipOtp(challenge.user.email)) {
      throw new BadRequestException('This account does not use email codes');
    }
    const now = Date.now();
    if (now - challenge.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new BadRequestException(
        'Please wait a minute before requesting another code',
      );
    }
    const code = this.generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(now + OTP_TTL_MS);
    await this.prisma.authOtpChallenge.update({
      where: { id: challenge.id },
      data: { codeHash, expiresAt, lastSentAt: new Date() },
    });
    const mailPurpose =
      challenge.purpose === OtpPurpose.REGISTER ? 'REGISTER' : 'LOGIN';
    await this.mail.sendOtpEmail(challenge.user.email, code, mailPurpose);
    return { ok: true as const };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(userId: string, email: string, role: UserRole) {
    const payload: JwtPayload = { sub: userId, email, role: role as string };
    const accessToken = await this.jwt.signAsync(payload);
    const plainRefresh = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(plainRefresh);
    const days = Number(this.config.get('REFRESH_TTL_DAYS') ?? 7);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return {
      accessToken,
      refreshToken: plainRefresh,
      user: { id: userId, email, role },
    };
  }

  async refresh(plainRefresh: string | undefined) {
    if (!plainRefresh) throw new UnauthorizedException('Missing refresh token');
    const tokenHash = this.hashToken(plainRefresh);
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) throw new UnauthorizedException('Invalid refresh token');
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
    });
    if (!user) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: string, plainRefresh?: string) {
    if (plainRefresh) {
      const tokenHash = this.hashToken(plainRefresh);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { ok: true };
  }
}
