import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../shared/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from '../../../../shared/lib/api-client';
import {
  fetchPipeline,
  savePipeline,
  validatePipelineApi,
  previewPipeline,
} from '../pipeline';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

beforeEach(() => { vi.clearAllMocks(); });

describe('Pipeline API', () => {
  it('fetchPipeline — GET /evaluations/:id/pipeline', async () => {
    const pipelineConfig = { blocks: [] };
    mockGet.mockResolvedValue({ data: { data: pipelineConfig } });
    const result = await fetchPipeline('e1');
    expect(mockGet).toHaveBeenCalledWith('/evaluations/e1/pipeline');
    expect(result).toEqual(pipelineConfig);
  });

  it('savePipeline — POST /evaluations/:id/pipeline/save', async () => {
    const config = { blocks: [{ type: 'normalize_to_max', params: {}, decimal: null }] };
    mockPost.mockResolvedValue({ data: { data: { success: true } } });
    await savePipeline('e1', config);
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/pipeline/save', { pipelineConfig: config });
  });

  it('validatePipelineApi — POST /evaluations/:id/pipeline/validate', async () => {
    const blocks = [{ type: 'normalize_to_max', params: {}, decimal: null }];
    mockPost.mockResolvedValue({ data: { data: { valid: true, errors: [] } } });
    const result = await validatePipelineApi('e1', blocks);
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/pipeline/validate', { blocks });
    expect(result.valid).toBe(true);
  });

  it('previewPipeline — POST /evaluations/:id/pipeline/preview', async () => {
    const blocks = [{ type: 'normalize_to_max', params: {}, decimal: null }];
    const sampleData = { score: 80 };
    mockPost.mockResolvedValue({ data: { data: { result: 80 } } });
    const result = await previewPipeline('e1', blocks, sampleData);
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/pipeline/preview', { blocks, sampleData });
    expect(result.result).toBe(80);
  });
});
