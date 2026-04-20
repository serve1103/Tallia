import { Injectable, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { ScoresService } from '../service/scores.service';
import { EvaluationsService } from '../../evaluations/service/evaluations.service';
import { ExcelService } from '../../excel/service/excel.service';
import { ResultExporter } from '../../excel/service/result-exporter';
import { PipelineExecutor } from '../../pipeline/pipeline-executor';
import { AuditService } from '../../audit/service/audit.service';
import { MappingTablesService } from '../../mapping-tables/service/mapping-tables.service';
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
    private readonly mappingTablesService: MappingTablesService,
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

    // D유형: mappingTable을 context에 주입
    if (config.type === 'D') {
      const mappingTable = await this.mappingTablesService.findByEvaluation(evaluationId, tenantId);
      if (mappingTable) {
        (context as any).mappingTable = {
          entries: mappingTable.entries.map((e) => ({
            conditions: e.conditions as Record<string, string | number>,
            score: e.score,
          })),
        };
      }
    }

    const scores: CreateScoreDto[] = [];
    const errors: { examineeNo: string; message: string }[] = [];
    let successCount = 0;

    for (const row of rawRows) {
      try {
        const committeeCount = config.type === 'A' && 'maxCommitteeCount' in config
          ? (config as any).maxCommitteeCount
          : undefined;

        // raw flat 데이터를 블록이 기대하는 형태로 변환
        const pipelineInput = this.transformInput(row.data, config, committeeCount);

        const result = this.pipelineExecutor.executeConfig(
          pipelineConfig,
          pipelineInput,
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

  /** 현재(최신) 업로드 ID 조회. 없으면 undefined. */
  private async resolveCurrentUploadId(evaluationId: string, tenantId: string): Promise<string | undefined> {
    const upload = await this.excelService.findCurrentUpload(evaluationId, tenantId);
    return upload?.id;
  }

  async getResults(evaluationId: string, tenantId: string, page: number, limit: number, sort?: string, failOnly?: boolean) {
    const uploadId = await this.resolveCurrentUploadId(evaluationId, tenantId);
    return this.scoresService.findAll({ tenantId, evaluationId, page, limit, sort, failOnly, uploadId });
  }

  async getResultDetail(evaluationId: string, examineeNo: string, tenantId: string) {
    const uploadId = await this.resolveCurrentUploadId(evaluationId, tenantId);
    return this.scoresService.findByExamineeNo(evaluationId, examineeNo, tenantId, uploadId);
  }

  async getStats(evaluationId: string, tenantId: string) {
    const uploadId = await this.resolveCurrentUploadId(evaluationId, tenantId);
    return this.scoresService.getStats(evaluationId, tenantId, uploadId);
  }

  async downloadResults(evaluationId: string, tenantId: string, includeIntermediate: boolean, res: Response, userId?: string) {
    // TODO: 대용량 데이터(100K+)에 대해 Prisma cursor 기반 스트리밍으로 전환하여 메모리 사용량 최적화 필요
    const uploadId = await this.resolveCurrentUploadId(evaluationId, tenantId);
    const { data: scores } = await this.scoresService.findAll({
      tenantId,
      evaluationId,
      page: 1,
      limit: 100000,
      uploadId,
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

  /**
   * raw flat 데이터를 파이프라인 블록이 기대하는 형태로 변환
   * A유형: { 인성_위원1: 96, ... } → { items: ['인성','전공적합성'], data: [[96,95,89],[87,85,95]] }
   * B유형: parseTypeB가 이미 { subjects: [{subjectId, examType, answers}] } 구조로 반환하므로 pass-through
   * 기타: 그대로 반환
   */
  private transformInput(rawData: Record<string, unknown>, config: EvalConfig, committeeCount?: number): unknown {
    if (config.type === 'A') {
      const aConfig = config as any;
      const items: string[] = aConfig.items.map((i: any) => i.name);
      const maxC = committeeCount ?? aConfig.maxCommitteeCount ?? 3;

      // items × committees 매트릭스 구성
      const matrix: number[][] = items.map((itemName: string) => {
        const row: number[] = [];
        for (let c = 1; c <= maxC; c++) {
          const key = `${itemName}_위원${c}`;
          row.push(Number(rawData[key]) || 0);
        }
        return row;
      });

      return { items, data: matrix };
    }

    if (config.type === 'B') {
      // parseTypeB가 이미 { subjects: [{subjectId, examType, answers}] } 구조로 반환.
      // rawData 자체가 TypeBRowData이므로 그대로 반환.
      return rawData;
    }

    if (config.type === 'C') {
      const cConfig = config as any;
      // 복수위원(committeeCount > 1)이고 committees 배열 구조인 경우 위원별 평균 집계
      if (cConfig.committeeCount > 1 && rawData && 'committees' in rawData) {
        const typeCData = rawData as { committees: Array<{ committeeNo: number; questions: Record<string, number> }> };
        const committees = typeCData.committees;
        if (committees.length === 0) return { questions: {} };

        // 모든 문항 키 수집
        const allKeys = new Set<string>();
        for (const c of committees) {
          Object.keys(c.questions).forEach((k) => allKeys.add(k));
        }

        // 위원별 평균 계산
        const averaged: Record<string, number> = {};
        for (const key of allKeys) {
          const values = committees.map((c) => c.questions[key] ?? 0);
          const avg = values.reduce((s, v) => s + v, 0) / values.length;
          averaged[key] = avg;
        }
        return { questions: averaged };
      }
      // 단일위원 또는 이미 flat 구조
      return rawData;
    }

    // D 유형은 flat 그대로
    return rawData;
  }
}
