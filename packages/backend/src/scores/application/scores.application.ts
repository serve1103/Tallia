import { Injectable, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ScoresService } from '../service/scores.service';
import { EvaluationsService } from '../../evaluations/service/evaluations.service';
import { ExcelService } from '../../excel/service/excel.service';
import { ResultExporter } from '../../excel/service/result-exporter';
import { PipelineExecutor } from '../../pipeline/pipeline-executor';
import { AuditService } from '../../audit/service/audit.service';
import type { ExecutionContext, PipelineConfig, DecimalConfig, EvalConfig } from '@tallia/shared';
import type { CreateScoreDto } from '../repository/scores.repository';

interface ParsedRow {
  examineeNo: string;
  examineeName: string;
  data: Record<string, unknown>;
}

@Injectable()
export class ScoresApplication {
  constructor(
    private readonly scoresService: ScoresService,
    private readonly evaluationsService: EvaluationsService,
    private readonly excelService: ExcelService,
    private readonly resultExporter: ResultExporter,
    private readonly pipelineExecutor: PipelineExecutor,
    private readonly auditService: AuditService,
  ) {}

  async calculate(evaluationId: string, tenantId: string, userId?: string) {
    const evaluation = await this.evaluationsService.findById(evaluationId, tenantId);
    const pipelineConfig = evaluation.pipelineConfig as unknown as PipelineConfig | null;

    if (!pipelineConfig) {
      throw new BadRequestException('파이프라인이 설정되지 않았습니다');
    }

    const currentUpload = await this.excelService.findCurrentUpload(evaluationId, tenantId);
    if (!currentUpload) {
      throw new BadRequestException('업로드된 데이터가 없습니다');
    }

    const rawRows = currentUpload.rawData as ParsedRow[];
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      throw new BadRequestException('업로드 데이터가 비어있습니다');
    }

    const config = evaluation.config as unknown as EvalConfig;
    const defaultDecimal: DecimalConfig = (evaluation.defaultDecimal as unknown as DecimalConfig) ?? { method: 'round', places: 2 };

    const context: ExecutionContext = {
      evaluationType: config.type,
      config,
      defaultDecimal,
    };

    const scores: CreateScoreDto[] = [];
    const errors: { examineeNo: string; message: string }[] = [];
    let successCount = 0;

    for (const row of rawRows) {
      try {
        const committeeCount = config.type === 'A' && 'maxCommitteeCount' in config
          ? (config as any).maxCommitteeCount
          : undefined;

        const result = this.pipelineExecutor.executeConfig(
          pipelineConfig,
          row.data,
          context,
          committeeCount,
        );

        const finalValue = typeof result.finalData === 'number'
          ? result.finalData
          : (result.finalData as any)?.value ?? null;

        scores.push({
          tenantId,
          evaluationId,
          uploadId: currentUpload.id,
          examineeNo: row.examineeNo,
          examineeName: row.examineeName,
          rawScore: finalValue,
          convertedScore: finalValue,
          failFlag: result.failFlags.length > 0,
          failReasons: result.failFlags,
          intermediateResults: result.intermediateResults,
          errorFlag: false,
          errorMessage: null,
        });
        successCount++;
      } catch (e) {
        const message = e instanceof Error ? e.message : '알 수 없는 오류';
        errors.push({ examineeNo: row.examineeNo, message });
        scores.push({
          tenantId,
          evaluationId,
          uploadId: currentUpload.id,
          examineeNo: row.examineeNo,
          examineeName: row.examineeName,
          rawScore: null,
          convertedScore: null,
          failFlag: false,
          failReasons: [],
          intermediateResults: [],
          errorFlag: true,
          errorMessage: message,
        });
      }
    }

    if (scores.length > 0) {
      await this.scoresService.saveResults(scores);
    }

    // 재계산 플래그 해제
    await this.evaluationsService.update(evaluationId, tenantId, {
      needsRecalculation: false,
      status: 'calculated',
    });

    // 감사 로그
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: 'calculate',
        resourceType: 'evaluation',
        resourceId: evaluationId,
        details: { successCount, errorCount: errors.length },
        ipAddress: '',
      }).catch(() => {});
    }

    return { successCount, errorCount: errors.length, errors };
  }

  async getResults(evaluationId: string, tenantId: string, page: number, limit: number, sort?: string, failOnly?: boolean) {
    return this.scoresService.findAll({ tenantId, evaluationId, page, limit, sort, failOnly });
  }

  async getResultDetail(evaluationId: string, examineeNo: string, tenantId: string) {
    return this.scoresService.findByExamineeNo(evaluationId, examineeNo, tenantId);
  }

  async downloadResults(evaluationId: string, tenantId: string, includeIntermediate: boolean, res: Response, userId?: string) {
    const { data: scores } = await this.scoresService.findAll({
      tenantId,
      evaluationId,
      page: 1,
      limit: 100000,
    });

    const workbook = await this.resultExporter.export(scores, includeIntermediate);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=results_${evaluationId}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();

    // 다운로드 감사 로그
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: 'download',
        resourceType: 'evaluation',
        resourceId: evaluationId,
        details: { rowCount: scores.length, includeIntermediate },
        ipAddress: '',
      }).catch(() => {});
    }
  }
}
