import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ScoresRepository, ScoreEntity, ScoreFilter, CreateScoreDto, ScoreStats } from '../repository/scores.repository';

@Injectable()
export class ScoresPrismaRepository implements ScoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ScoreFilter): Promise<{ data: ScoreEntity[]; total: number }> {
    const where: Record<string, unknown> = {
      tenantId: filter.tenantId,
      evaluationId: filter.evaluationId,
    };
    if (filter.uploadId) where.uploadId = filter.uploadId;
    if (filter.failOnly) where.failFlag = true;

    const [data, total] = await Promise.all([
      this.prisma.score.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: {
          [filter.sort === 'raw_score' ? 'rawScore' : filter.sort === 'converted_score' ? 'convertedScore' : 'examineeNo']: 'asc',
        },
      }),
      this.prisma.score.count({ where }),
    ]);

    return { data: data as unknown as ScoreEntity[], total };
  }

  async findByExamineeNo(evaluationId: string, examineeNo: string, tenantId: string, uploadId?: string): Promise<ScoreEntity | null> {
    const where: Record<string, unknown> = { evaluationId, examineeNo, tenantId };
    if (uploadId) where.uploadId = uploadId;
    const score = await this.prisma.score.findFirst({
      where,
      orderBy: { calculatedAt: 'desc' },
    });
    return score as unknown as ScoreEntity | null;
  }

  async upsertBatch(scores: CreateScoreDto[]): Promise<number> {
    const operations = scores.map((score) =>
      this.prisma.score.upsert({
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
      }),
    );
    const results = await this.prisma.$transaction(operations);
    return results.length;
  }

  async deleteByEvaluation(evaluationId: string, tenantId: string): Promise<number> {
    const { count } = await this.prisma.score.deleteMany({
      where: { evaluationId, tenantId },
    });
    return count;
  }

  async getStats(evaluationId: string, tenantId: string, uploadId?: string): Promise<ScoreStats> {
    const baseWhere: Record<string, unknown> = { evaluationId, tenantId };
    if (uploadId) baseWhere.uploadId = uploadId;
    const where = { ...baseWhere, errorFlag: false };

    const [aggregate, total, failCount] = await Promise.all([
      this.prisma.score.aggregate({
        where,
        _avg: { convertedScore: true },
        _max: { convertedScore: true },
        _count: true,
      }),
      this.prisma.score.count({ where: baseWhere }),
      this.prisma.score.count({ where: { ...baseWhere, failFlag: true } }),
    ]);

    const avg = aggregate._avg.convertedScore;
    const max = aggregate._max.convertedScore;
    return {
      total,
      average: avg != null ? Number(avg) : null,
      failCount,
      max: max != null ? Number(max) : null,
    };
  }
}
