import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  calculateScores,
  fetchCalculateStatus,
  fetchResults,
  fetchResultDetail,
  fetchResultStats,
  downloadResults,
} from '../api/scores';

export function useResults(
  evaluationId: string | undefined,
  page: number,
  limit: number,
  failOnly?: boolean,
) {
  return useQuery({
    queryKey: ['evaluations', evaluationId, 'results', { page, limit, failOnly }],
    queryFn: () => fetchResults(evaluationId!, { page, limit, failOnly }),
    enabled: !!evaluationId,
  });
}

export function useResultStats(evaluationId: string | undefined) {
  return useQuery({
    queryKey: ['evaluations', evaluationId, 'results', 'stats'],
    queryFn: () => fetchResultStats(evaluationId!),
    enabled: !!evaluationId,
  });
}

export function useResultDetail(evaluationId: string | undefined, examineeNo: string | undefined) {
  return useQuery({
    queryKey: ['evaluations', evaluationId, 'results', examineeNo],
    queryFn: () => fetchResultDetail(evaluationId!, examineeNo!),
    enabled: !!evaluationId && !!examineeNo,
  });
}

export function useCalculateStatus(evaluationId: string | undefined) {
  return useQuery({
    queryKey: ['evaluations', evaluationId, 'calculate', 'status'],
    queryFn: () => fetchCalculateStatus(evaluationId!),
    enabled: !!evaluationId,
  });
}

export function useCalculateScores(evaluationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => calculateScores(evaluationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId, 'results'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId, 'calculate'] });
      queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId] });
    },
  });
}

export function useDownloadResults(evaluationId: string) {
  return useMutation({
    mutationFn: (opts: { includeIntermediate?: boolean } = {}) =>
      downloadResults(evaluationId, opts.includeIntermediate ?? false),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results_${evaluationId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
