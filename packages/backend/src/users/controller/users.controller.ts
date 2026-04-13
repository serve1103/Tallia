import { Controller, Get, Post, Body } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { UsersApplication } from '../application/users.application';

@Controller('users')
export class UsersController {
  constructor(private readonly usersApp: UsersApplication) {}

  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload) {
    const profile = await this.usersApp.getProfile(user.sub);
    return { data: profile };
  }

  @Post('me/update')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() body: { name?: string }) {
    const profile = await this.usersApp.updateProfile(user.sub, body);
    return { data: profile };
  }
}
