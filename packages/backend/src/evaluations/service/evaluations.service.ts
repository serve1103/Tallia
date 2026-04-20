import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EVALUATIONS_REPOSITORY } from '../repository/evaluations.repository';
import type {
  EvaluationsRepository,
  CreateEvaluationDto,
  UpdateEvaluationDto,
  EvaluationFilter,
} from '../repository/evaluations.repository';

@Injectable()
export class EvaluationsService {
  constructor(@Inject(EVALUATIONS_REPOSITORY) private readonly repo: EvaluationsRepository) {}

  async findAll(filter: EvaluationFilter) {
    return this.repo.findAll(filter);
  }

  async findById(id: string, tenantId: string) {
    const evaluation = await this.repo.findById(id, tenantId);
    if (!evaluation) throw new NotFoundException('평가를 찾을 수 없습니다');
    return evaluation;
  }

  async create(dto: CreateEvaluationDto) {
    return this.repo.create(dto);
  }

  async update(id: string, tenantId: string, dto: UpdateEvaluationDto) {
    await this.findById(id, tenantId);

    // 설정 변경 시 재계산 필요 플래그
    if (dto.config || dto.pipelineConfig) {
      dto.needsRecalculation = true;
    }

    return this.repo.update(id, tenantId, dto);
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.repo.delete(id, tenantId);
  }

  async restore(id: string, tenantId: string) {
    // 휴지통에서 복원 — deletedAt이 있는 평가만 대상
    const filter = { tenantId, onlyDeleted: true };
    const all = await this.repo.findAll(filter);
    const evaluation = all.find((e) => e.id === id);
    if (!evaluation) throw new NotFoundException('평가를 찾을 수 없습니다');
    return this.repo.restore(id, tenantId);
  }

  async hardDelete(id: string, tenantId: string) {
    // 휴지통에 있는 평가만 영구 삭제 가능
    const filter = { tenantId, onlyDeleted: true };
    const all = await this.repo.findAll(filter);
    const evaluation = all.find((e) => e.id === id);
    if (!evaluation) throw new NotFoundException('평가를 찾을 수 없습니다');
    await this.repo.hardDelete(id, tenantId);
  }

  async findTrash(tenantId: string) {
    return this.repo.findAll({ tenantId, onlyDeleted: true });
  }

  async copy(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.repo.copy(id, tenantId);
  }

  async getConfig(id: string, tenantId: string) {
    const evaluation = await this.findById(id, tenantId);
    return evaluation.config;
  }

  async saveConfig(id: string, tenantId: string, config: unknown) {
    return this.update(id, tenantId, { config: config as any });
  }
}
