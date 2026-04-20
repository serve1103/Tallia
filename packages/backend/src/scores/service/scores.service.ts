import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SCORES_REPOSITORY } from '../repository/scores.repository';
import type { ScoresRepository, ScoreFilter, CreateScoreDto, ScoreStats } from '../repository/scores.repository';

@Injectable()
export class ScoresService {
  constructor(@Inject(SCORES_REPOSITORY) private readonly repo: ScoresRepository) {}

  async findAll(filter: ScoreFilter) {
    return this.repo.findAll(filter);
  }

  async findByExamineeNo(evaluationId: string, examineeNo: string, tenantId: string) {
    const score = await this.repo.findByExamineeNo(evaluationId, examineeNo, tenantId);
    if (!score) throw new NotFoundException('수험자 결과를 찾을 수 없습니다');
    return score;
  }

  async saveResults(scores: CreateScoreDto[]) {
    return this.repo.upsertBatch(scores);
  }

  async deleteByEvaluation(evaluationId: string, tenantId: string) {
    return this.repo.deleteByEvaluation(evaluationId, tenantId);
  }

  async getStats(evaluationId: string, tenantId: string): Promise<ScoreStats> {
    return this.repo.getStats(evaluationId, tenantId);
  }
}
