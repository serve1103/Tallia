import { apiClient } from '../../../shared/lib/api-client';
import type { Score, CalculateResult } from '@tallia/shared';

interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number };
}

export async function calculateScores(evaluationId: string): Promise<CalculateResult> {
  const { data } = await apiClient.post(`/evaluations/${evaluationId}/calculate`);
  return data.data;
}

export async function fetchCalculateStatus(evaluationId: string): Promise<{ status: string }> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/calculate/status`);
  return data.data;
}

export async function fetchResults(
  evaluationId: string,
  params: PaginationParams,
): Promise<PaginatedResponse<Score>> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/results`, { params });
  return data;
}

export async function fetchResultDetail(evaluationId: string, examineeNo: string): Promise<Score> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/results/${examineeNo}`);
  return data.data;
}

export async function downloadResults(evaluationId: string): Promise<Blob> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/results/download`, {
    responseType: 'blob',
  });
  return data;
}
