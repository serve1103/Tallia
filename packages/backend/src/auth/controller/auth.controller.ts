import { Controller, Post, Body, Res, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { AuthApplication } from '../application/auth.application';

@Controller('auth')
export class AuthController {
  constructor(private readonly authApp: AuthApplication) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('signup')
  async signup(
    @Body() body: { email: string; password: string; name: string; inviteCode?: string },
  ) {
    const result = await this.authApp.signup(body.email, body.password, body.name, body.inviteCode);
    return { data: result };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authApp.login(body.email, body.password, res);
    return { data: result };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const result = await this.authApp.refresh(refreshToken, res);
    return { data: result };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { userId: string }) {
    await this.authApp.verifyEmail(body.userId);
    return { data: { verified: true } };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    await this.authApp.forgotPassword(body.email);
    return { data: { sent: true } };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { userId: string; newPassword: string }) {
    await this.authApp.resetPassword(body.userId, body.newPassword);
    return { data: { reset: true } };
  }
}
