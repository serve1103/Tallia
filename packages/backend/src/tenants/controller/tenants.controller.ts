import { Controller, Get, Post, Body, Param } from '@nestjs/common';

import { Roles } from '../../common/decorators/roles.decorator';
import { TenantsApplication } from '../application/tenants.application';

@Controller('admin/tenants')
@Roles('platform_admin')
export class TenantsController {
  constructor(private readonly tenantsApp: TenantsApplication) {}

  @Post()
  async create(
    @Body() body: { name: string; allowedDomains: string[]; inviteCode: string; dataRetentionYears?: number },
  ) {
    const tenant = await this.tenantsApp.create(body);
    return { data: tenant };
  }

  @Get()
  async findAll() {
    const tenants = await this.tenantsApp.findAll();
    return { data: tenants };
  }

  @Get(':tenantId')
  async findById(@Param('tenantId') tenantId: string) {
    const tenant = await this.tenantsApp.findById(tenantId);
    return { data: tenant };
  }

  @Post(':tenantId/update')
  async update(
    @Param('tenantId') tenantId: string,
    @Body() body: { name?: string; allowedDomains?: string[]; inviteCode?: string; dataRetentionYears?: number },
  ) {
    const tenant = await this.tenantsApp.update(tenantId, body);
    return { data: tenant };
  }

  @Post(':tenantId/delete')
  async delete(@Param('tenantId') tenantId: string) {
    await this.tenantsApp.delete(tenantId);
    return { data: { deleted: true } };
  }

  @Get(':tenantId/users')
  async findUsers(@Param('tenantId') tenantId: string) {
    const users = await this.tenantsApp.findUsers(tenantId);
    return { data: users };
  }

  @Post(':tenantId/users/:userId/remove')
  async removeUser(@Param('tenantId') tenantId: string, @Param('userId') userId: string) {
    await this.tenantsApp.removeUser(tenantId, userId);
    return { data: { removed: true } };
  }
}
