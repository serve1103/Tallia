import { Controller, Get, Post, Body, Param } from '@nestjs/common';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { BlockRegistry } from '../block-registry';
import { PipelineValidator } from '../pipeline-validator';
import { EvaluationsService } from '../../evaluations/service/evaluations.service';
import type { PipelineBlock, EvalConfig, EvaluationType } from '@tallia/shared';

@Controller('evaluations/:id/pipeline')
export class PipelineController {
  constructor(
    private readonly registry: BlockRegistry,
    private readonly validator: PipelineValidator,
    private readonly evaluationsService: EvaluationsService,
  ) {}

  @Get()
  async getPipeline(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const evaluation = await this.evaluationsService.findById(id, tenantId);
    return { data: evaluation.pipelineConfig };
  }

  @Post('save')
  async savePipeline(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { pipelineConfig: unknown },
  ) {
    await this.evaluationsService.update(id, tenantId, {
      pipelineConfig: body.pipelineConfig as Record<string, unknown>,
    });
    return { data: { saved: true } };
  }

  @Post('validate')
  async validatePipeline(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { blocks: PipelineBlock[] },
  ) {
    const evaluation = await this.evaluationsService.findById(id, tenantId);
    const result = this.validator.validate(
      body.blocks,
      evaluation.type as EvaluationType,
      evaluation.config as unknown as EvalConfig,
    );
    return { data: result };
  }

  @Post('preview')
  async previewPipeline(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { blocks: PipelineBlock[]; sampleData: unknown },
  ) {
    // Phase 5 — 샘플 데이터로 파이프라인 테스트 실행
    const evaluation = await this.evaluationsService.findById(id, tenantId);
    return { data: { evaluation: evaluation.name, preview: 'Phase 5에서 구현' } };
  }
}
