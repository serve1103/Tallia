import { Injectable, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { MappingTablesService } from '../service/mapping-tables.service';
import { EvaluationsService } from '../../evaluations/service/evaluations.service';
import { MappingTemplateGenerator } from '../../excel/service/mapping-template-generator';
import { MappingUploadParser } from '../../excel/service/mapping-upload-parser';
import type { TypeDConfig, ColumnDef } from '@tallia/shared';
import type { UpsertMappingEntryDto } from '../repository/mapping-tables.repository';

interface SaveEntriesDto {
  entries: Array<{
    conditions: Record<string, string | number>;
    score: number;
    sortOrder?: number;
  }>;
}

@Injectable()
export class MappingTablesApplication {
  constructor(
    private readonly mappingTablesService: MappingTablesService,
    private readonly evaluationsService: EvaluationsService,
    private readonly mappingTemplateGenerator: MappingTemplateGenerator,
    private readonly mappingUploadParser: MappingUploadParser,
  ) {}

  async findByEvaluation(evaluationId: string, tenantId: string) {
    const table = await this.mappingTablesService.findByEvaluation(evaluationId, tenantId);
    if (!table) {
      return { entries: [] };
    }
    return {
      id: table.id,
      mappingType: table.mappingType,
      columnsDef: table.columnsDef,
      entries: table.entries.map((e) => ({
        id: e.id,
        conditions: e.conditions as Record<string, string | number>,
        score: e.score,
        sortOrder: e.sortOrder,
      })),
    };
  }

  async saveEntries(evaluationId: string, tenantId: string, dto: SaveEntriesDto) {
    const evaluation = await this.evaluationsService.findById(evaluationId, tenantId);
    const config = evaluation.config as unknown as TypeDConfig;

    if (config.type !== 'D') {
      throw new BadRequestException('D유형 평가가 아닙니다');
    }

    const entries: UpsertMappingEntryDto[] = dto.entries.map((e, index) => ({
      conditions: e.conditions as any,
      score: e.score,
      sortOrder: e.sortOrder ?? index,
    }));

    const result = await this.mappingTablesService.upsertEntries(
      evaluationId,
      tenantId,
      config.mappingType,
      config.inputColumns as any,
      entries,
    );

    return {
      id: result.id,
      mappingType: result.mappingType,
      entries: result.entries.map((e) => ({
        id: e.id,
        conditions: e.conditions as Record<string, string | number>,
        score: e.score,
        sortOrder: e.sortOrder,
      })),
    };
  }

  async uploadFromFile(evaluationId: string, tenantId: string, buffer: Buffer) {
    const parsedEntries = await this.mappingUploadParser.parse(buffer);

    const evaluation = await this.evaluationsService.findById(evaluationId, tenantId);
    const config = evaluation.config as unknown as TypeDConfig;

    if (config.type !== 'D') {
      throw new BadRequestException('D유형 평가가 아닙니다');
    }

    const result = await this.mappingTablesService.upsertEntries(
      evaluationId,
      tenantId,
      config.mappingType,
      config.inputColumns as any,
      parsedEntries,
    );

    return {
      id: result.id,
      mappingType: result.mappingType,
      entries: result.entries.map((e) => ({
        id: e.id,
        conditions: e.conditions as Record<string, string | number>,
        score: e.score,
        sortOrder: e.sortOrder,
      })),
    };
  }

  async downloadTemplate(evaluationId: string, tenantId: string, res: Response) {
    const evaluation = await this.evaluationsService.findById(evaluationId, tenantId);
    const config = evaluation.config as unknown as TypeDConfig;

    if (config.type !== 'D') {
      throw new BadRequestException('D유형 평가가 아닙니다');
    }

    const inputColumns: ColumnDef[] = config.inputColumns;
    const workbook = await this.mappingTemplateGenerator.generate(inputColumns);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=mapping_template_${evaluationId}.xlsx`,
    );
    await workbook.xlsx.write(res);
    res.end();
  }
}
