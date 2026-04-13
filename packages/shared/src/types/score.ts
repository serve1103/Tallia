import type { FailFlag, IntermediateResult } from './pipeline.js';

export interface Score {
  id: string;
  tenantId: string;
  evaluationId: string;
  uploadId: string;
  examineeNo: string;
  examineeName: string;
  /** DECIMAL(10,4) — JavaScript number로 표현. 정밀도 한계 인지. */
  rawScore: number | null;
  /** DECIMAL(10,4) — JavaScript number로 표현. 정밀도 한계 인지. */
  convertedScore: number | null;
  failFlag: boolean;
  failReasons: FailFlag[];
  intermediateResults: IntermediateResult[];
  errorFlag: boolean;
  errorMessage: string | null;
  calculatedAt: string | null;
}

export interface ScoreUpload {
  id: string;
  tenantId: string;
  evaluationId: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  status: 'validated' | 'active' | 'rolled_back';
  isCurrent: boolean;
  rawData: unknown[];
  validationErrors: unknown[];
  uploadedBy: string;
  uploadedAt: string;
}

export interface CalculateResult {
  successCount: number;
  errorCount: number;
  errors: { examineeNo: string; message: string }[];
}
