import { apiClient } from '../../../shared/lib/api-client';
import type { Evaluation, EvalConfig, EvaluationType, ScoreRange } from '@tallia/shared';
import type { PaginatedResponse } from '../../../shared/types/api';

interface FetchParams {
  page: number;
  limit: number;
  type?: EvaluationType;
  academicYear?: string;
  admissionType?: string;
  trash?: boolean;
}

export async function fetchEvaluations(params: FetchParams): Promise<PaginatedResponse<Evaluation>> {
  const { data } = await apiClient.get('/evaluations', {
    params: {
      page: params.page,
      limit: params.limit,
      type: params.type,
      academic_year: params.academicYear,
      admission_type: params.admissionType,
      ...(params.trash ? { trash: 'true' } : {}),
    },
  });
  const items = data.data;
  return { data: items, meta: { total: items.length } };
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

export async function restoreEvaluation(
  id: string,
  newName?: string,
): Promise<Evaluation> {
  const { data } = await apiClient.post(`/evaluations/${id}/restore`, newName ? { newName } : {});
  return data.data;
}

export async function hardDeleteEvaluation(id: string): Promise<void> {
  await apiClient.post(`/evaluations/${id}/hard-delete`);
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
  await apiClient.post(`/evaluations/${id}/config/save`, { config });
}

export async function saveAnswerKey(
  evaluationId: string,
  subjectId: string,
  examType: string,
  answerKey: AnswerKeyEntry[],
  scoreRanges?: ScoreRange[],
): Promise<void> {
  await apiClient.post(`/evaluations/${evaluationId}/answer-key/save`, {
    subjectId,
    examType,
    answerKey,
    scoreRanges,
  });
}

export type { ScoreRange };

export async function reportQuestionError(
  evaluationId: string,
  payload: { subjectId: string; questionNo: number; handling: 'all_correct' | 'exclude' },
): Promise<void> {
  await apiClient.post(`/evaluations/${evaluationId}/question-error`, payload);
}

export async function removeQuestionError(
  evaluationId: string,
  payload: { subjectId: string; questionNo: number },
): Promise<void> {
  await apiClient.post(`/evaluations/${evaluationId}/question-error/remove`, payload);
}

export interface AnswerKeyEntry {
  questionNo: number;
  answers: string[];
  score: number;
}

export async function downloadAnswerKeyTemplate(
  evaluationId: string,
  subjectId: string,
  examType?: string,
): Promise<void> {
  const params: Record<string, string> = { subjectId };
  if (examType) params.examType = examType;
  const query = new URLSearchParams(params).toString();
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/answer-key/template?${query}`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `answer_key_${subjectId}_${examType ?? '기본'}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadAnswerKey(
  evaluationId: string,
  subjectId: string,
  file: File,
  examType?: string,
): Promise<void> {
  const params: Record<string, string> = { subjectId };
  if (examType) params.examType = examType;
  const query = new URLSearchParams(params).toString();
  const formData = new FormData();
  formData.append('file', file);
  await apiClient.post(`/evaluations/${evaluationId}/answer-key/upload?${query}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
