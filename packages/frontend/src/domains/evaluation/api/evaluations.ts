import { apiClient } from '../../../shared/lib/api-client';
import type { Evaluation, EvalConfig, EvaluationType } from '@tallia/shared';

interface FetchParams {
  page: number;
  limit: number;
  type?: EvaluationType;
  academicYear?: string;
  admissionType?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page?: number; limit?: number };
}

export async function fetchEvaluations(params: FetchParams): Promise<PaginatedResponse<Evaluation>> {
  const { data } = await apiClient.get('/evaluations', { params });
  return data;
}

export async function fetchEvaluation(id: string): Promise<Evaluation> {
  const { data } = await apiClient.get(`/evaluations/${id}`);
  return data.data;
}

export async function createEvaluation(input: { name: string; type: EvaluationType; academicYear?: string; admissionType?: string }): Promise<Evaluation> {
  const { data } = await apiClient.post('/evaluations', input);
  return data.data;
}

export async function updateEvaluation(id: string, input: Partial<Evaluation>): Promise<Evaluation> {
  const { data } = await apiClient.post(`/evaluations/${id}/update`, input);
  return data.data;
}

export async function deleteEvaluation(id: string): Promise<void> {
  await apiClient.post(`/evaluations/${id}/delete`);
}

export async function copyEvaluation(id: string): Promise<Evaluation> {
  const { data } = await apiClient.post(`/evaluations/${id}/copy`);
  return data.data;
}

export async function fetchEvalConfig(id: string): Promise<EvalConfig> {
  const { data } = await apiClient.get(`/evaluations/${id}/config`);
  return data.data;
}

export async function saveEvalConfig(id: string, config: unknown): Promise<void> {
  await apiClient.post(`/evaluations/${id}/config/save`, config);
}
