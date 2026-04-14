// JSON 필드는 unknown으로 정의 (Prisma generate 전에도 동작)
type JsonValue = unknown;

export interface ScoreEntity {
  id: string;
  tenantId: string;
  evaluationId: string;
  uploadId: string;
  examineeNo: string;
  examineeName: string;
  rawScore: number | null;
  convertedScore: number | null;
  failFlag: boolean;
  failReasons: JsonValue;
  intermediateResults: JsonValue;
  errorFlag: boolean;
  errorMessage: string | null;
  calculatedAt: Date | null;
}

export interface CreateScoreDto {
  tenantId: string;
  evaluationId: string;
  uploadId: string;
  examineeNo: string;
  examineeName: string;
  rawScore: number | null;
  convertedScore: number | null;
  failFlag: boolean;
  failReasons: JsonValue;
  intermediateResults: JsonValue;
  errorFlag: boolean;
  errorMessage: string | null;
}

export interface ScoreFilter {
  tenantId: string;
  evaluationId: string;
  page: number;
  limit: number;
  sort?: string;
  failOnly?: boolean;
}

export interface ScoresRepository {
  findAll(filter: ScoreFilter): Promise<{ data: ScoreEntity[]; total: number }>;
  findByExamineeNo(evaluationId: string, examineeNo: string, tenantId: string): Promise<ScoreEntity | null>;
  upsertBatch(scores: CreateScoreDto[]): Promise<number>;
  deleteByEvaluation(evaluationId: string, tenantId: string): Promise<number>;
}

export const SCORES_REPOSITORY = Symbol('SCORES_REPOSITORY');
