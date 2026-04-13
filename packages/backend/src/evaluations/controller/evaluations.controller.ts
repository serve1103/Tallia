import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { EvaluationsApplication } from '../application/evaluations.application';

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsApp: EvaluationsApplication) {}

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() body: { name: string; type: string; academicYear?: string; admissionType?: string; config: unknown },
  ) {
    const evaluation = await this.evaluationsApp.create(tenantId, body);
    return { data: evaluation };
  }

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('academic_year') academicYear?: string,
    @Query('admission_type') admissionType?: string,
    @Query('type') type?: string,
  ) {
    const evaluations = await this.evaluationsApp.findAll({ tenantId, academicYear, admissionType, type });
    return { data: evaluations };
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const evaluation = await this.evaluationsApp.findById(id, tenantId);
    return { data: evaluation };
  }

  @Post(':id/update')
  async update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const evaluation = await this.evaluationsApp.update(id, tenantId, body);
    return { data: evaluation };
  }

  @Post(':id/delete')
  async delete(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    await this.evaluationsApp.delete(id, tenantId);
    return { data: { deleted: true } };
  }

  @Post(':id/copy')
  async copy(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const evaluation = await this.evaluationsApp.copy(id, tenantId);
    return { data: evaluation };
  }

  // --- Config 엔드포인트 (§3.5) ---

  @Get(':id/config')
  async getConfig(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const config = await this.evaluationsApp.getConfig(id, tenantId);
    return { data: config };
  }

  @Post(':id/config/save')
  async saveConfig(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { config: unknown },
  ) {
    const evaluation = await this.evaluationsApp.saveConfig(id, tenantId, body.config);
    return { data: evaluation };
  }

  @Get(':id/config/preview')
  async previewConfig(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    // Phase 5 — 파이프라인 엔진 연동 후 구현
    const config = await this.evaluationsApp.getConfig(id, tenantId);
    return { data: { config, preview: null } };
  }
}
