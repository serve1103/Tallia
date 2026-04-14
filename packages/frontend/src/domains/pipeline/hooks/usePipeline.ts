import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPipeline, savePipeline, validatePipelineApi, previewPipeline } from '../api/pipeline';
import type { PipelineBlock, PipelineConfig } from '@tallia/shared';

export function usePipelineConfig(evaluationId: string | undefined) {
  return useQuery({
    queryKey: ['evaluations', evaluationId, 'pipeline'],
    queryFn: () => fetchPipeline(evaluationId!),
    enabled: !!evaluationId,
  });
}

export function useSavePipeline(evaluationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: PipelineConfig) => savePipeline(evaluationId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId, 'pipeline'] });
    },
  });
}

export function useValidatePipeline(evaluationId: string) {
  return useMutation({
    mutationFn: (blocks: PipelineBlock[]) => validatePipelineApi(evaluationId, blocks),
  });
}

export function usePreviewPipeline(evaluationId: string) {
  return useMutation({
    mutationFn: ({ blocks, sampleData }: { blocks: PipelineBlock[]; sampleData: unknown }) =>
      previewPipeline(evaluationId, blocks, sampleData),
  });
}
