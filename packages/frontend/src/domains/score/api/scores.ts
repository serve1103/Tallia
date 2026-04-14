import { apiClient } from '../../../shared/lib/api-client';
import type { Score, CalculateResult } from '@tallia/shared';
import type { PaginationParams, PaginatedResponse } from '../../../shared/types/api';

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
