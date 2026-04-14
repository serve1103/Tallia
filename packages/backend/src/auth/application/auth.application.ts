import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

import { AuthService } from '../service/auth.service';
import type { TokenPair } from '../service/auth.service';

@Injectable()
export class AuthApplication {
  constructor(private readonly authService: AuthService) {}

  async signup(email: string, password: string, name: string, inviteCode?: string) {
    return this.authService.signup(email, password, name, inviteCode);
  }

  async login(email: string, password: string, res: Response) {
    const tokens = await this.authService.login(email, password);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  async refresh(refreshToken: string, res: Response) {
    const tokens = await this.authService.refresh(refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  async logout(res: Response) {
    res.clearCookie('refreshToken', { httpOnly: true, path: '/api/v1/auth/refresh' });
  }

  async verifyEmail(userId: string) {
    return this.authService.verifyEmail(userId);
  }

  async forgotPassword(email: string) {
    return this.authService.forgotPassword(email);
  }

  async resetPassword(userId: string, newPassword: string) {
    return this.authService.resetPassword(userId, newPassword);
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });
  }
}
