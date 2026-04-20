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
    const previewResult = {
      sampleInput: { items: ['인성'], data: [[80]] },
      intermediateResults: [{ blockIndex: 0, blockType: 'normalize_to_max', label: '정규화', output: { value: 80 } }],
      finalData: { value: 80 },
      failFlags: [],
    };
    mockPost.mockResolvedValue({ data: { data: previewResult } });
    const result = await previewPipeline('e1');
    expect(mockPost).toHaveBeenCalledWith('/evaluations/e1/pipeline/preview', {});
    expect(result.finalData).toEqual({ value: 80 });
  });
});
