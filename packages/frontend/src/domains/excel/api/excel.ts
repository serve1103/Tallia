import { apiClient } from '../../../shared/lib/api-client';
import type { ScoreUpload } from '@tallia/shared';

export async function downloadTemplate(evaluationId: string): Promise<Blob> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/excel/template`, {
    responseType: 'blob',
  });
  return data;
}

export async function uploadExcel(evaluationId: string, file: File): Promise<ScoreUpload> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post(`/evaluations/${evaluationId}/excel/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function fetchUploads(evaluationId: string): Promise<ScoreUpload[]> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/excel/uploads`);
  return data.data;
}

export async function rollbackUpload(evaluationId: string, uploadId: string): Promise<void> {
  await apiClient.post(`/evaluations/${evaluationId}/excel/rollback/${uploadId}`);
}
