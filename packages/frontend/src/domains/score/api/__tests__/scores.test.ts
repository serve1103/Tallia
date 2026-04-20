import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../shared/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from '../../../../shared/lib/api-client';
import {
  calculateScores,
  fetchCalculateStatus,
  fetchResults,
  fetchResultDetail,
  downloadResults,
} from '../scores';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

beforeEach(() => { vi.clearAllMocks(); });

describe('Scores API', () => {
  it('calculateScores — POST /evaluations/:id/calculate', async () => {
    mockPost.mockResolvedValue({ data: { data: { successCount: 10, errorCount: 0, errors: [] } } });
    const result = await calculateScores('e1');
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/calculate');
    expect(result.successCount).toBe(10);
  });

  it('fetchCalculateStatus — GET /evaluations/:id/calculate/status', async () => {
    mockGet.mockResolvedValue({ data: { data: { status: 'completed' } } });
    const result = await fetchCalculateStatus('e1');
    expect(mockGet).toHaveBeenCalledWith('/evaluations/e1/calculate/status');
    expect(result.status).toBe('completed');
  });

  it('fetchResults — GET /evaluations/:id/results', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { total: 0 } } });
    const result = await fetchResults('e1', { page: 1, limit: 20 });
    expect(mockGet).toHaveBeenCalledWith('/evaluations/e1/results', { params: { page: 1, limit: 20, failOnly: undefined } });
    expect(result.data).toEqual([]);
  });

  it('fetchResultDetail — GET /evaluations/:id/results/:examineeNo', async () => {
    const score = { examineeNo: '001', rawScore: 95 };
    mockGet.mockResolvedValue({ data: { data: score } });
    const result = await fetchResultDetail('e1', '001');
    expect(mockGet).toHaveBeenCalledWith('/evaluations/e1/results/001');
    expect(result.examineeNo).toBe('001');
  });

  it('downloadResults — GET /evaluations/:id/results/download', async () => {
    mockGet.mockResolvedValue({ data: new Blob() });
    await downloadResults('e1');
    expect(mockGet).toHaveBeenCalledWith('/evaluations/e1/results/download', {
      params: { includeIntermediate: undefined },
      responseType: 'blob',
    });
  });
});
