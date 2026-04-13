import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { TENANTS_REPOSITORY } from '../repository/tenants.repository';
import type { TenantsRepository, CreateTenantDto, UpdateTenantDto } from '../repository/tenants.repository';

@Injectable()
export class TenantsService {
  constructor(@Inject(TENANTS_REPOSITORY) private readonly repo: TenantsRepository) {}

  async findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const tenant = await this.repo.findById(id);
    if (!tenant) throw new NotFoundException('대학을 찾을 수 없습니다');
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.repo.findByInviteCode(dto.inviteCode);
    if (existing) throw new ConflictException('초대 코드가 이미 사용 중입니다');
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findById(id);
    return this.repo.update(id, dto);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
  }

  async findUsers(tenantId: string) {
    await this.findById(tenantId);
    return this.repo.findUsers(tenantId);
  }

  async removeUser(tenantId: string, userId: string) {
    await this.repo.removeUser(tenantId, userId);
  }
}
