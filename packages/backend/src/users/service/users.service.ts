import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../repository/users.repository';
import type { UsersRepository } from '../repository/users.repository';

@Injectable()
export class UsersService {
  constructor(@Inject(USERS_REPOSITORY) private readonly repo: UsersRepository) {}

  async findById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  async updateProfile(id: string, dto: { name?: string }) {
    await this.findById(id);
    return this.repo.updateProfile(id, dto);
  }
}
