import { Controller, Get, Post, Body, Param } from '@nestjs/common';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { BlockRegistry } from '../block-registry';
import { PipelineValidator } from '../pipeline-validator';
import { PipelineExecutor } from '../pipeline-executor';
import { EvaluationsService } from '../../evaluations/service/evaluations.service';
import { getSampleInput } from '../sample-data';
import type { PipelineBlock, EvalConfig, EvaluationType, ExecutionContext, DecimalConfig } from '@tallia/shared';

@Controller('evaluations/:id/pipeline')
export class PipelineController {
  constructor(
    private readonly registry: BlockRegistry,
    private readonly validator: PipelineValidator,
    private readonly pipelineExecutor: PipelineExecutor,
    private readonly evaluationsService: EvaluationsService,
  ) {}

  @Get('blocks')
  async getBlockDefinitions(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const evaluation = await this.evaluationsService.findById(id, tenantId);
    const definitions = this.registry.getByType(evaluation.type as EvaluationType);
    return { data: definitions };
  }

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
      pipelineConfig: body.pipelineConfig as any,
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
  ) {
    const evaluation = await this.evaluationsService.findById(id, tenantId);
    const pipelineConfig = evaluation.pipelineConfig;

    if (!pipelineConfig) {
      return {
        data: {
          sampleInput: null,
          intermediateResults: [],
          finalData: null,
          failFlags: [],
          errorMessage: '파이프라인이 설정되지 않았습니다',
        },
      };
    }

    const evalConfig = evaluation.config as unknown as EvalConfig;
    const sampleInput = getSampleInput(evalConfig);

    const defaultDecimal: DecimalConfig = (evaluation as any).defaultDecimal ?? {
      method: 'round',
      places: 2,
    };

    const context: ExecutionContext = {
      evaluationType: evaluation.type as EvaluationType,
      config: evalConfig,
      defaultDecimal,
    };

    // A유형: 위원 수 샘플 (3명 기본)
    const committeeCount =
      evaluation.type === 'A' && 'maxCommitteeCount' in evalConfig
        ? Math.min((evalConfig as any).maxCommitteeCount, 3)
        : undefined;

    try {
      const result = this.pipelineExecutor.executeConfig(pipelineConfig as unknown as import('@tallia/shared').PipelineConfig, sampleInput, context, committeeCount);
      return {
        data: {
          sampleInput,
          intermediateResults: result.intermediateResults,
          finalData: result.finalData,
          failFlags: result.failFlags,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        data: {
          sampleInput,
          intermediateResults: [],
          finalData: null,
          failFlags: [],
          errorMessage: `파이프라인 실행 실패: ${message}`,
        },
      };
    }
  }
}
