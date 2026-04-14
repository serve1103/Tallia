import { Injectable } from '@nestjs/common';
import { UsersService } from '../service/users.service';

@Injectable()
export class UsersApplication {
  constructor(private readonly usersService: UsersService) {}

  async getProfile(userId: string) {
    return this.usersService.findById(userId);
  }

  async updateProfile(userId: string, dto: { name?: string }) {
    return this.usersService.updateProfile(userId, dto);
  }
}
