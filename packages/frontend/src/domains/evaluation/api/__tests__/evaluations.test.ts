import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../shared/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from '../../../../shared/lib/api-client';
import {
  fetchEvaluations,
  fetchEvaluation,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  copyEvaluation,
  fetchEvalConfig,
  saveEvalConfig,
} from '../evaluations';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

beforeEach(() => { vi.clearAllMocks(); });

describe('Evaluations API', () => {
  it('fetchEvaluations — GET /evaluations', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { total: 0 } } });
    const result = await fetchEvaluations({ page: 1, limit: 20 });
    expect(mockGet).toHaveBeenCalledWith('/evaluations', {
      params: { page: 1, limit: 20, type: undefined, academic_year: undefined, admission_type: undefined },
    });
    expect(result).toEqual({ data: [], meta: { total: 0 } });
  });

  it('fetchEvaluations — 필터 파라미터', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { total: 0 } } });
    await fetchEvaluations({ page: 1, limit: 20, type: 'A', academicYear: '2026' });
    expect(mockGet).toHaveBeenCalledWith('/evaluations', {
      params: { page: 1, limit: 20, type: 'A', academic_year: '2026', admission_type: undefined },
    });
  });

  it('fetchEvaluation — GET /evaluations/:id', async () => {
    const evaluation = { id: 'e1', name: 'Test', type: 'A' };
    mockGet.mockResolvedValue({ data: { data: evaluation } });
    const result = await fetchEvaluation('e1');
    expect(mockGet).toHaveBeenCalledWith('/evaluations/e1');
    expect(result).toEqual(evaluation);
  });

  it('createEvaluation — POST /evaluations', async () => {
    const input = { name: 'New', type: 'A' as const };
    mockPost.mockResolvedValue({ data: { data: { id: 'e2', ...input } } });
    const result = await createEvaluation(input);
    expect(mockPost).toHaveBeenCalledWith('/evaluations', input);
    expect(result.id).toBe('e2');
  });

  it('updateEvaluation — POST /evaluations/:id/update', async () => {
    mockPost.mockResolvedValue({ data: { data: { id: 'e1', name: 'Updated' } } });
    const result = await updateEvaluation('e1', { name: 'Updated' });
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/update', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('deleteEvaluation — POST /evaluations/:id/delete', async () => {
    mockPost.mockResolvedValue({ data: { data: { success: true } } });
    await deleteEvaluation('e1');
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/delete');
  });

  it('copyEvaluation — POST /evaluations/:id/copy', async () => {
    mockPost.mockResolvedValue({ data: { data: { id: 'e3' } } });
    const result = await copyEvaluation('e1');
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/copy');
    expect(result.id).toBe('e3');
  });

  it('fetchEvalConfig — GET /evaluations/:id/config', async () => {
    const config = { type: 'A', items: [] };
    mockGet.mockResolvedValue({ data: { data: config } });
    const result = await fetchEvalConfig('e1');
    expect(mockGet).toHaveBeenCalledWith('/evaluations/e1/config');
    expect(result).toEqual(config);
  });

  it('saveEvalConfig — POST /evaluations/:id/config/save', async () => {
    const config = { type: 'A', items: [] };
    mockPost.mockResolvedValue({ data: { data: { success: true } } });
    await saveEvalConfig('e1', config);
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/config/save', { config });
  });
});
