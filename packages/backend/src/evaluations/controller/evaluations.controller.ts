import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';

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
    const config = await this.evaluationsApp.getConfig(id, tenantId);
    return { data: { config, preview: null } };
  }

  // --- B유형 정답지 (§3.11) ---

  @Post(':id/answer-key/save')
  async saveAnswerKey(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { subjectId: string; examType?: string; answerKey: unknown[] },
  ) {
    if (!body.subjectId || !body.answerKey) {
      throw new BadRequestException('subjectId와 answerKey는 필수입니다');
    }
    const result = await this.evaluationsApp.saveAnswerKey(
      id,
      tenantId,
      body.subjectId,
      body.answerKey,
      body.examType,
    );
    return { data: result };
  }

  @Post(':id/question-error')
  async reportQuestionError(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { subjectId: string; questionNo: number; handling: 'all_correct' | 'exclude' },
  ) {
    if (!body.subjectId || body.questionNo == null || !body.handling) {
      throw new BadRequestException('subjectId, questionNo, handling은 필수입니다');
    }
    const result = await this.evaluationsApp.reportQuestionError(id, tenantId, body);
    return { data: result };
  }
}
