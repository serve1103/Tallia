import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EvaluationsService } from '../service/evaluations.service';
import type { EvaluationFilter } from '../repository/evaluations.repository';
import { getDefaultPipeline } from '../../pipeline/default-pipelines';

@Injectable()
export class EvaluationsApplication {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  async findAll(filter: EvaluationFilter) {
    return this.evaluationsService.findAll(filter);
  }

  async findById(id: string, tenantId: string) {
    return this.evaluationsService.findById(id, tenantId);
  }

  async create(tenantId: string, body: { name: string; type: string; academicYear?: string; admissionType?: string; config?: unknown; pipelineConfig?: unknown }) {
    const defaultConfigs: Record<string, unknown> = {
      A: { type: 'A', maxCommitteeCount: 3, dataType: 'score', items: [] },
      B: { type: 'B', subjects: [], totalFailThreshold: null },
      C: { type: 'C', committeeCount: 2, questions: [], totalFailThreshold: null },
      D: { type: 'D', mappingType: 'custom', inputColumns: [], maxScore: 100, totalFailThreshold: null },
    };
    return this.evaluationsService.create({
      tenantId,
      name: body.name,
      type: body.type,
      academicYear: body.academicYear,
      admissionType: body.admissionType,
      config: (body.config ?? defaultConfigs[body.type] ?? {}) as any,
      pipelineConfig: (body.pipelineConfig as any) ?? getDefaultPipeline(body.type as 'A' | 'B' | 'C' | 'D'),
    });
  }

  async update(id: string, tenantId: string, body: Record<string, unknown>) {
    return this.evaluationsService.update(id, tenantId, body);
  }

  async delete(id: string, tenantId: string) {
    return this.evaluationsService.delete(id, tenantId);
  }

  async copy(id: string, tenantId: string) {
    return this.evaluationsService.copy(id, tenantId);
  }

  async getConfig(id: string, tenantId: string) {
    return this.evaluationsService.getConfig(id, tenantId);
  }

  async saveConfig(id: string, tenantId: string, config: unknown) {
    return this.evaluationsService.saveConfig(id, tenantId, config);
  }

  async saveAnswerKey(
    id: string,
    tenantId: string,
    subjectId: string,
    answerKey: unknown[],
    examType?: string,
  ) {
    const evaluation = await this.evaluationsService.findById(id, tenantId);
    const config = evaluation.config as Record<string, unknown>;

    if (config?.type !== 'B') {
      throw new BadRequestException('정답지는 B유형에서만 사용 가능합니다');
    }

    const subjects = (config.subjects as Array<Record<string, unknown>>) ?? [];
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) throw new NotFoundException('과목을 찾을 수 없습니다');

    const examTypes = (subject.examTypes as Array<Record<string, unknown>>) ?? [];
    if (examTypes.length === 0) {
      throw new BadRequestException('과목에 시험유형이 등록되지 않았습니다');
    }

    // examType(name 또는 id)이 주어지면 해당 유형에만 저장, 아니면 첫 번째 유형에 저장
    const target = examType
      ? examTypes.find((et) => et.name === examType || et.id === examType)
      : examTypes[0];
    if (!target) throw new NotFoundException('시험유형을 찾을 수 없습니다');

    target.answerKey = answerKey;
    return this.evaluationsService.saveConfig(id, tenantId, config);
  }

  async reportQuestionError(
    id: string,
    tenantId: string,
    body: { subjectId: string; questionNo: number; handling: 'all_correct' | 'exclude' },
  ) {
    const evaluation = await this.evaluationsService.findById(id, tenantId);
    const config = evaluation.config as Record<string, unknown>;

    if (config?.type !== 'B') {
      throw new BadRequestException('출제 오류는 B유형에서만 사용 가능합니다');
    }

    const subjects = (config.subjects as Array<Record<string, unknown>>) ?? [];
    const subject = subjects.find((s) => s.id === body.subjectId);
    if (!subject) throw new NotFoundException('과목을 찾을 수 없습니다');

    const errors = (subject.questionErrors as Array<Record<string, unknown>>) ?? [];
    errors.push({ questionNo: body.questionNo, handling: body.handling });
    subject.questionErrors = errors;

    return this.evaluationsService.saveConfig(id, tenantId, config);
  }
}
