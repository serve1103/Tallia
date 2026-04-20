import { apiClient } from '../../../shared/lib/api-client';
import type { Score, CalculateResult } from '@tallia/shared';
import type { PaginationParams, PaginatedResponse } from '../../../shared/types/api';

export interface ResultStats {
  total: number;
  average: number | null;
  failCount: number;
  max: number | null;
}

export async function calculateScores(evaluationId: string): Promise<CalculateResult> {
  const { data } = await apiClient.post(`/evaluations/${evaluationId}/calculate`);
  return data.data;
}

export async function fetchCalculateStatus(evaluationId: string): Promise<{ status: string }> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/calculate/status`);
  return data.data;
}

export async function fetchResultStats(evaluationId: string): Promise<ResultStats> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/results/stats`);
  return data.data;
}

export async function fetchResults(
  evaluationId: string,
  params: PaginationParams & { failOnly?: boolean },
): Promise<PaginatedResponse<Score>> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/results`, {
    params: {
      page: params.page,
      limit: params.limit,
      failOnly: params.failOnly ? 'true' : undefined,
    },
  });
  return data;
}

export async function fetchResultDetail(evaluationId: string, examineeNo: string): Promise<Score> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/results/${examineeNo}`);
  return data.data;
}

export async function downloadResults(evaluationId: string, includeIntermediate = false): Promise<Blob> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/results/download`, {
    params: { includeIntermediate: includeIntermediate ? 'true' : undefined },
    responseType: 'blob',
  });
  return data;
}
