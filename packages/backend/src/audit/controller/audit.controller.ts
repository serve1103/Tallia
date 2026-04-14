import { Controller, Get, Param, Query } from '@nestjs/common';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditService } from '../service/audit.service';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('evaluations/:id/audit-logs')
  async getByEvaluation(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const logs = await this.auditService.findByEvaluation(id, tenantId);
    return { data: logs };
  }

  @Get('admin/tenants/:tenantId/audit-logs')
  @Roles('platform_admin')
  async getByTenant(
    @Param('tenantId') tenantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.auditService.findByTenant(tenantId, Number(page), Math.min(Number(limit), 100));
    return { data: result.data, meta: { total: result.total, page: Number(page), limit: Number(limit) } };
  }
}
