import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
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
    await this.assertUniqueName(dto.tenantId, dto.name);
    return this.repo.create(dto);
  }

  async update(id: string, tenantId: string, dto: UpdateEvaluationDto) {
    await this.findById(id, tenantId);

    // 이름 변경 시 같은 테넌트 내 중복 방지 (자기 자신 제외)
    if (dto.name != null) {
      await this.assertUniqueName(tenantId, dto.name, id);
    }

    // 설정 변경 시 재계산 필요 플래그
    if (dto.config || dto.pipelineConfig) {
      dto.needsRecalculation = true;
    }

    return this.repo.update(id, tenantId, dto);
  }

  private async assertUniqueName(tenantId: string, name: string, excludeId?: string) {
    const trimmed = name.trim();
    if (!trimmed) return; // 빈 이름은 스키마 단계에서 걸러짐
    const exists = await this.repo.existsByName(tenantId, trimmed, excludeId);
    if (exists) {
      throw new ConflictException('같은 이름의 평가가 이미 존재합니다');
    }
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.repo.delete(id, tenantId);
  }

  async restore(id: string, tenantId: string, newName?: string) {
    // 휴지통에서 복원 — deletedAt이 있는 평가만 대상
    const filter = { tenantId, onlyDeleted: true };
    const all = await this.repo.findAll(filter);
    const evaluation = all.find((e) => e.id === id);
    if (!evaluation) throw new NotFoundException('평가를 찾을 수 없습니다');

    const targetName = newName?.trim() || evaluation.name;
    // 복원 시 현재 활성 평가와 이름 충돌 방지
    const nameTaken = await this.repo.existsByName(tenantId, targetName);
    if (nameTaken) {
      throw new ConflictException(`같은 이름("${targetName}")의 활성 평가가 이미 존재합니다`);
    }

    const restored = await this.repo.restore(id, tenantId);
    // newName 이 기존 이름과 다르면 rename 적용
    if (newName && newName.trim() && newName.trim() !== evaluation.name) {
      return this.repo.update(id, tenantId, { name: newName.trim() });
    }
    return restored;
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
