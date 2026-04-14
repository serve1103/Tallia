import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../shared/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from '../../../../shared/lib/api-client';
import {
  downloadTemplate,
  uploadExcel,
  fetchUploads,
  rollbackUpload,
} from '../excel';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

beforeEach(() => vi.clearAllMocks());

describe('Excel API', () => {
  it('downloadTemplate — GET /evaluations/:id/excel/template', async () => {
    mockGet.mockResolvedValue({ data: new Blob() });
    await downloadTemplate('e1');
    expect(mockGet).toHaveBeenCalledWith('/evaluations/e1/excel/template', { responseType: 'blob' });
  });

  it('uploadExcel — POST /evaluations/:id/excel/upload (multipart)', async () => {
    const file = new File(['test'], 'test.xlsx');
    mockPost.mockResolvedValue({ data: { data: { id: 'u1', rowCount: 10, validationErrors: [] } } });
    const result = await uploadExcel('e1', file);
    expect(mockPost).toHaveBeenCalled();
    const callArgs = mockPost.mock.calls[0];
    expect(callArgs[0]).toBe('/evaluations/e1/excel/upload');
    expect(callArgs[1]).toBeInstanceOf(FormData);
    expect(result.id).toBe('u1');
  });

  it('fetchUploads — GET /evaluations/:id/excel/uploads', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 'u1' }] } });
    const result = await fetchUploads('e1');
    expect(mockGet).toHaveBeenCalledWith('/evaluations/e1/excel/uploads');
    expect(result).toHaveLength(1);
  });

  it('rollbackUpload — POST /evaluations/:id/excel/rollback/:uploadId', async () => {
    mockPost.mockResolvedValue({ data: { data: { success: true } } });
    await rollbackUpload('e1', 'u1');
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/excel/rollback/u1');
  });
});
