import { Injectable, Inject, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { AUTH_REPOSITORY } from '../repository/auth.repository';
import type { AuthRepository } from '../repository/auth.repository';

const SALT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  tenantId: string | null;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(email: string, password: string, name: string, inviteCode?: string) {
    const existing = await this.authRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException('이미 등록된 이메일입니다');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 테넌트 배정: 도메인 이메일 매칭 또는 invite_code — Phase 2에서 TenantService 연동
    const tenantId: string | null = null;

    const user = await this.authRepo.create({
      email,
      passwordHash,
      name,
      role: 'tenant_admin',
      tenantId,
    });

    return { userId: user.id };
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    return this.generateTokens({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.authRepo.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다');
      }

      // RT Rotation: 새 토큰 쌍 발급
      return this.generateTokens({
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.authRepo.updateEmailVerified(userId, true);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      // 이메일 존재 여부 노출 방지 — 항상 성공 응답
      return;
    }
    // 이메일 발송 stub — 인프라 확정 후 구현 (§8 미결사항)
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.authRepo.updatePassword(userId, passwordHash);
  }

  private generateTokens(payload: JwtPayload): TokenPair {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
