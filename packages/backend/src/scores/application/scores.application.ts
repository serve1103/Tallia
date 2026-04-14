import { Injectable } from '@nestjs/common';
import { ScoresService } from '../service/scores.service';
import { EvaluationsService } from '../../evaluations/service/evaluations.service';
import { PipelineExecutor } from '../../pipeline/pipeline-executor';
import type { ExecutionContext, PipelineBlock, DecimalConfig, EvalConfig } from '@tallia/shared';
import type { CreateScoreDto } from '../repository/scores.repository';

@Injectable()
export class ScoresApplication {
  constructor(
    private readonly scoresService: ScoresService,
    private readonly evaluationsService: EvaluationsService,
    private readonly pipelineExecutor: PipelineExecutor,
  ) {}

  async calculate(evaluationId: string, tenantId: string) {
    const evaluation = await this.evaluationsService.findById(evaluationId, tenantId);
    const pipelineConfig = evaluation.pipelineConfig as { blocks?: PipelineBlock[] } | null;
    const blocks = pipelineConfig?.blocks ?? [];

    if (blocks.length === 0) {
      return { successCount: 0, errorCount: 0, errors: [{ examineeNo: '', message: '파이프라인이 설정되지 않았습니다' }] };
    }

    // TODO: ScoreUpload에서 rawData를 가져와서 행별로 파이프라인 실행
    // 현재는 구조만 잡아둠 — DB 연결 후 실제 데이터 처리
    const config = evaluation.config as unknown as EvalConfig;
    const defaultDecimal: DecimalConfig = (evaluation.defaultDecimal as unknown as DecimalConfig) ?? { method: 'round', places: 2 };

    const context: ExecutionContext = {
      evaluationType: config.type,
      config,
      defaultDecimal,
    };

    // Placeholder: 실제 구현은 ScoreUpload에서 rawData를 가져와 실행
    const successCount = 0;
    const errorCount = 0;
    const errors: { examineeNo: string; message: string }[] = [];

    return { successCount, errorCount, errors };
  }

  async getResults(evaluationId: string, tenantId: string, page: number, limit: number, sort?: string, failOnly?: boolean) {
    return this.scoresService.findAll({
      tenantId,
      evaluationId,
      page,
      limit,
      sort,
      failOnly,
    });
  }

  async getResultDetail(evaluationId: string, examineeNo: string, tenantId: string) {
    return this.scoresService.findByExamineeNo(evaluationId, examineeNo, tenantId);
  }
}
