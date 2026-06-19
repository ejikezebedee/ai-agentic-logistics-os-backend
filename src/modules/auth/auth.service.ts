import { BadRequestException, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode } from '../../common/domain.enums';

type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  twoFactorEnabled?: boolean;
  roles?: Array<{ role: { code: RoleCode } }>;
};

type MemorySession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  revokedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  rotatedAt?: Date;
};

type MemoryResetToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
};

type MemoryTwoFactorChallenge = {
  id: string;
  userId: string;
  method: string;
  status: 'pending' | 'verified' | 'expired';
  expiresAt: Date;
  verifiedAt?: Date;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  private readonly memoryUsers = new Map<string, AuthUser>();
  private readonly memorySessions = new Map<string, MemorySession>();
  private readonly memoryResetTokens = new Map<string, MemoryResetToken>();
  private readonly memoryTwoFactorChallenges = new Map<string, MemoryTwoFactorChallenge>();
  private readonly jwtSecret = process.env.JWT_SECRET ?? 'development-local-jwt-secret-change-before-production';
  private readonly refreshTtlMs = 1000 * 60 * 60 * 24 * 30;

  constructor(
    private readonly jwt: JwtService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  async login(email: string, password: string, twoFactorCode?: string) {
    const user = await this.findUser(email);
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    if (user.twoFactorEnabled && !twoFactorCode) {
      return { twoFactorRequired: true, challenge: 'totp_or_recovery_code' };
    }
    return this.issueTokens(user);
  }

  async listSessions(userId: string) {
    if (this.hasPrisma()) {
      const sessions = await (this.prisma as any).session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, revokedAt: true, expiresAt: true, createdAt: true, rotatedAt: true }
      });
      return { sessions };
    }
    return {
      sessions: [...this.memorySessions.values()]
        .filter((session) => session.userId === userId)
        .map(({ id, revokedAt, expiresAt, createdAt, rotatedAt }) => ({ id, revokedAt, expiresAt, createdAt, rotatedAt }))
    };
  }

  async invalidateSession(userId: string, sessionId: string) {
    if (this.hasPrisma()) {
      await (this.prisma as any).session.updateMany({ where: { id: sessionId, userId }, data: { revokedAt: new Date() } });
      return { status: 'session_invalidated', sessionId };
    }
    const session = this.memorySessions.get(sessionId);
    if (session?.userId === userId) session.revokedAt = new Date();
    return { status: 'session_invalidated', sessionId };
  }

  async refresh(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);
    const session = await this.findActiveSession(refreshTokenHash);
    if (!session) throw new UnauthorizedException('Refresh token is invalid or expired.');

    const user = await this.findUserById(session.userId);
    if (!user) throw new UnauthorizedException('Session user not found.');
    await this.revokeSession(session.id);
    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    const session = await this.findActiveSession(this.hashToken(refreshToken));
    if (session) await this.revokeSession(session.id);
    return { status: 'logged_out' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.findUser(email);
    if (!user) return { status: 'accepted' };
    const resetToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(resetToken);
    if (this.hasPrisma()) {
      await (this.prisma as any).passwordResetToken?.create?.({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 30) }
      });
    } else {
      const reset = {
        id: `reset_${this.memoryResetTokens.size + 1}`,
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        createdAt: new Date()
      };
      this.memoryResetTokens.set(reset.id, reset);
    }
    return { status: 'accepted', developmentResetToken: resetToken };
  }

  async completePasswordReset(token: string, newPassword: string) {
    if (newPassword.length < 12) throw new BadRequestException('Password must be at least 12 characters.');
    const tokenHash = this.hashToken(token);
    if (!this.hasPrisma() || !(this.prisma as any).passwordResetToken) {
      const reset = [...this.memoryResetTokens.values()].find((item) => item.tokenHash === tokenHash && !item.usedAt && item.expiresAt > new Date());
      if (!reset) throw new UnauthorizedException('Password reset token is invalid or expired.');
      const user = await this.findUserById(reset.userId);
      if (!user) throw new UnauthorizedException('Password reset user not found.');
      user.passwordHash = await hash(newPassword, 12);
      reset.usedAt = new Date();
      for (const session of this.memorySessions.values()) {
        if (session.userId === reset.userId && !session.revokedAt) session.revokedAt = new Date();
      }
      return { status: 'password_reset_completed' };
    }
    const reset = await (this.prisma as any).passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } }
    });
    if (!reset) throw new UnauthorizedException('Password reset token is invalid or expired.');
    await (this.prisma as any).$transaction([
      (this.prisma as any).user.update({ where: { id: reset.userId }, data: { passwordHash: await hash(newPassword, 12) } }),
      (this.prisma as any).passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      (this.prisma as any).session.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } })
    ]);
    return { status: 'password_reset_completed' };
  }

  async beginTwoFactorSetup(userId: string) {
    const challenge = {
      id: `mfa_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      method: 'mock_totp',
      status: 'pending' as const,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      createdAt: new Date()
    };
    if (this.hasPrisma()) {
      const created = await (this.prisma as any).twoFactorChallenge.create({
        data: { userId, method: challenge.method, status: challenge.status, expiresAt: challenge.expiresAt }
      });
      return { userId, status: 'two_factor_setup_ready', challengeId: created.id, methods: ['totp', 'recovery_code'], mockVerificationCode: '000000' };
    }
    this.memoryTwoFactorChallenges.set(challenge.id, challenge);
    return { userId, status: 'two_factor_setup_ready', challengeId: challenge.id, methods: ['totp', 'recovery_code'], mockVerificationCode: '000000' };
  }

  async verifyTwoFactor(userId: string, challengeId: string, code: string) {
    if (code !== '000000') throw new UnauthorizedException('Two-factor code is invalid.');
    if (this.hasPrisma()) {
      const challenge = await (this.prisma as any).twoFactorChallenge.findFirst({
        where: { id: challengeId, userId, status: 'pending', expiresAt: { gt: new Date() } }
      });
      if (!challenge) throw new UnauthorizedException('Two-factor challenge is invalid or expired.');
      await (this.prisma as any).twoFactorChallenge.update({ where: { id: challenge.id }, data: { status: 'verified', verifiedAt: new Date() } });
      return { status: 'two_factor_verified', challengeId };
    }
    const challenge = this.memoryTwoFactorChallenges.get(challengeId);
    if (!challenge || challenge.userId !== userId || challenge.status !== 'pending' || challenge.expiresAt <= new Date()) {
      throw new UnauthorizedException('Two-factor challenge is invalid or expired.');
    }
    challenge.status = 'verified';
    challenge.verifiedAt = new Date();
    return { status: 'two_factor_verified', challengeId };
  }

  private async issueTokens(user: AuthUser) {
    const roles = user.roles?.map((item) => item.role.code) ?? [];
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, roles }, { secret: this.jwtSecret, expiresIn: '15m' });
    const refreshToken = randomBytes(48).toString('base64url');
    await this.createSession(user.id, this.hashToken(refreshToken));
    return {
      user: { id: user.id, email: user.email, roles },
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresInSeconds: 900
    };
  }

  private async findUser(email: string): Promise<AuthUser | null> {
    if (this.hasPrisma()) {
      return (this.prisma as any).user.findUnique({ where: { email }, include: { roles: { include: { role: true } } } });
    }
    const existing = this.memoryUsers.get(email);
    if (existing) return existing;
    const seeded = {
      id: 'mem_super_admin',
      email,
      passwordHash: await hash('ChangeMe-Local-Only-123!', 12),
      roles: [{ role: { code: RoleCode.SUPER_ADMIN } }]
    };
    this.memoryUsers.set(email, seeded);
    return seeded;
  }

  private async findUserById(id: string): Promise<AuthUser | null> {
    if (this.hasPrisma()) {
      return (this.prisma as any).user.findUnique({ where: { id }, include: { roles: { include: { role: true } } } });
    }
    return [...this.memoryUsers.values()].find((user) => user.id === id) ?? null;
  }

  private async createSession(userId: string, refreshTokenHash: string) {
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);
    if (this.hasPrisma()) {
      return (this.prisma as any).session.create({ data: { userId, refreshTokenHash, expiresAt } });
    }
    const session = { id: `ses_${this.memorySessions.size + 1}`, userId, refreshTokenHash, expiresAt, createdAt: new Date() };
    this.memorySessions.set(session.id, session);
    return session;
  }

  private async findActiveSession(refreshTokenHash: string): Promise<MemorySession | null> {
    if (this.hasPrisma()) {
      return (this.prisma as any).session.findFirst({ where: { refreshTokenHash, revokedAt: null, expiresAt: { gt: new Date() } } });
    }
    return [...this.memorySessions.values()].find((session) => session.refreshTokenHash === refreshTokenHash && !session.revokedAt && session.expiresAt > new Date()) ?? null;
  }

  private async revokeSession(id: string) {
    if (this.hasPrisma()) {
      await (this.prisma as any).session.update({ where: { id }, data: { revokedAt: new Date(), rotatedAt: new Date() } });
      return;
    }
    const session = this.memorySessions.get(id);
    if (session) {
      session.revokedAt = new Date();
      session.rotatedAt = new Date();
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).user?.findUnique === 'function');
  }
}
