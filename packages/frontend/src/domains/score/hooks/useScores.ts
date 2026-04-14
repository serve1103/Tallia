import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  calculateScores,
  fetchCalculateStatus,
  fetchResults,
  fetchResultDetail,
  downloadResults,
} from '../api/scores';

export function useResults(evaluationId: string | undefined, page: number, limit: number) {
  return useQuery({
    queryKey: ['evaluations', evaluationId, 'results', { page, limit }],
    queryFn: () => fetchResults(evaluationId!, { page, limit }),
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
    },
  });
}

export function useDownloadResults(evaluationId: string) {
  return useMutation({
    mutationFn: () => downloadResults(evaluationId),
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
