import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EvaluationsService } from '../service/evaluations.service';
import type { EvaluationFilter } from '../repository/evaluations.repository';

@Injectable()
export class EvaluationsApplication {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  async findAll(filter: EvaluationFilter) {
    return this.evaluationsService.findAll(filter);
  }

  async findById(id: string, tenantId: string) {
    return this.evaluationsService.findById(id, tenantId);
  }

  async create(tenantId: string, body: { name: string; type: string; academicYear?: string; admissionType?: string; config: unknown; pipelineConfig?: unknown }) {
    return this.evaluationsService.create({
      tenantId,
      name: body.name,
      type: body.type,
      academicYear: body.academicYear,
      admissionType: body.admissionType,
      config: body.config as any,
      pipelineConfig: (body.pipelineConfig as any) ?? { blocks: [] },
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

  async saveAnswerKey(id: string, tenantId: string, subjectId: string, answerKey: unknown[]) {
    const evaluation = await this.evaluationsService.findById(id, tenantId);
    const config = evaluation.config as Record<string, unknown>;

    if (config?.type !== 'B') {
      throw new BadRequestException('정답지는 B유형에서만 사용 가능합니다');
    }

    const subjects = (config.subjects as Array<Record<string, unknown>>) ?? [];
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) throw new NotFoundException('과목을 찾을 수 없습니다');

    // 정답지를 과목 내 examTypes에 저장
    subject.answerKey = answerKey;
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
