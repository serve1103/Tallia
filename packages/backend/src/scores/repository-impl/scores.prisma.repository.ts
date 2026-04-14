import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ScoresRepository, ScoreEntity, ScoreFilter, CreateScoreDto } from '../repository/scores.repository';

@Injectable()
export class ScoresPrismaRepository implements ScoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ScoreFilter): Promise<{ data: ScoreEntity[]; total: number }> {
    const where: Record<string, unknown> = {
      tenantId: filter.tenantId,
      evaluationId: filter.evaluationId,
    };
    if (filter.failOnly) where.failFlag = true;

    const [data, total] = await Promise.all([
      this.prisma.score.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { examineeNo: filter.sort === 'examinee_no' ? 'asc' : 'asc' },
      }),
      this.prisma.score.count({ where }),
    ]);

    return { data: data as unknown as ScoreEntity[], total };
  }

  async findByExamineeNo(evaluationId: string, examineeNo: string, tenantId: string): Promise<ScoreEntity | null> {
    const score = await this.prisma.score.findFirst({
      where: { evaluationId, examineeNo, tenantId },
    });
    return score as unknown as ScoreEntity | null;
  }

  async upsertBatch(scores: CreateScoreDto[]): Promise<number> {
    let count = 0;
    for (const score of scores) {
      await this.prisma.score.upsert({
        where: {
          evaluationId_uploadId_examineeNo: {
            evaluationId: score.evaluationId,
            uploadId: score.uploadId,
            examineeNo: score.examineeNo,
          },
        },
        update: {
          rawScore: score.rawScore,
          convertedScore: score.convertedScore,
          failFlag: score.failFlag,
          failReasons: score.failReasons as any,
          intermediateResults: score.intermediateResults as any,
          errorFlag: score.errorFlag,
          errorMessage: score.errorMessage,
          calculatedAt: new Date(),
        },
        create: {
          tenantId: score.tenantId,
          evaluationId: score.evaluationId,
          uploadId: score.uploadId,
          examineeNo: score.examineeNo,
          examineeName: score.examineeName,
          rawScore: score.rawScore,
          convertedScore: score.convertedScore,
          failFlag: score.failFlag,
          failReasons: score.failReasons as any,
          intermediateResults: score.intermediateResults as any,
          errorFlag: score.errorFlag,
          errorMessage: score.errorMessage,
          calculatedAt: new Date(),
        },
      });
      count++;
    }
    return count;
  }

  async deleteByEvaluation(evaluationId: string, tenantId: string): Promise<number> {
    const { count } = await this.prisma.score.deleteMany({
      where: { evaluationId, tenantId },
    });
    return count;
  }
}
