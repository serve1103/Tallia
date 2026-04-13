import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UsersRepository, UserProfileEntity } from '../repository/users.repository';

const SELECT_PROFILE = {
  id: true,
  email: true,
  name: true,
  role: true,
  tenantId: true,
  emailVerified: true,
} as const;

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserProfileEntity | null> {
    return this.prisma.user.findUnique({ where: { id }, select: SELECT_PROFILE });
  }

  async updateProfile(id: string, dto: { name?: string }): Promise<UserProfileEntity> {
    return this.prisma.user.update({ where: { id }, data: dto, select: SELECT_PROFILE });
  }
}
