import { Injectable } from '@nestjs/common';
import { TenantsService } from '../service/tenants.service';
import type { CreateTenantDto, UpdateTenantDto } from '../repository/tenants.repository';

@Injectable()
export class TenantsApplication {
  constructor(private readonly tenantsService: TenantsService) {}

  async findAll() {
    return this.tenantsService.findAll();
  }

  async findById(id: string) {
    return this.tenantsService.findById(id);
  }

  async create(dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  async update(id: string, dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  async delete(id: string) {
    return this.tenantsService.delete(id);
  }

  async findUsers(tenantId: string) {
    return this.tenantsService.findUsers(tenantId);
  }

  async removeUser(tenantId: string, userId: string) {
    return this.tenantsService.removeUser(tenantId, userId);
  }
}
