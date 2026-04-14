import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantsRepository, TenantEntity, CreateTenantDto, UpdateTenantDto } from '../repository/tenants.repository';

@Injectable()
export class TenantsPrismaRepository implements TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TenantEntity[]> {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<TenantEntity | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async findByInviteCode(code: string): Promise<TenantEntity | null> {
    return this.prisma.tenant.findUnique({ where: { inviteCode: code } });
  }

  async findByDomain(domain: string): Promise<TenantEntity | null> {
    return this.prisma.tenant.findFirst({ where: { allowedDomains: { has: domain } } });
  }

  async create(dto: CreateTenantDto): Promise<TenantEntity> {
    return this.prisma.tenant.create({ data: dto });
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantEntity> {
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tenant.delete({ where: { id } });
  }

  async findUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true, name: true, role: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeUser(tenantId: string, userId: string): Promise<void> {
    await this.prisma.user.deleteMany({ where: { id: userId, tenantId } });
  }
}
