import { apiClient } from '../../../shared/lib/api-client';
import type { PipelineConfig, PipelineBlock, BlockDefinition, ValidationResult } from '@tallia/shared';

export async function fetchBlockDefinitions(evaluationId: string): Promise<BlockDefinition[]> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/pipeline/blocks`);
  return data.data;
}

export async function fetchPipeline(evaluationId: string): Promise<PipelineConfig> {
  const { data } = await apiClient.get(`/evaluations/${evaluationId}/pipeline`);
  return data.data;
}

export async function savePipeline(evaluationId: string, config: PipelineConfig): Promise<void> {
  await apiClient.post(`/evaluations/${evaluationId}/pipeline/save`, { pipelineConfig: config });
}

export async function validatePipelineApi(
  evaluationId: string,
  blocks: PipelineBlock[],
): Promise<ValidationResult> {
  const { data } = await apiClient.post(`/evaluations/${evaluationId}/pipeline/validate`, { blocks });
  return data.data;
}

export async function previewPipeline(
  evaluationId: string,
  blocks: PipelineBlock[],
  sampleData: unknown,
): Promise<{ result: unknown }> {
  const { data } = await apiClient.post(`/evaluations/${evaluationId}/pipeline/preview`, {
    blocks,
    sampleData,
  });
  return data.data;
}
