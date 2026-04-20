import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { downloadTemplate, uploadExcel, uploadExcelSkipErrors, fetchUploads, rollbackUpload } from '../api/excel';

export function useUploads(evaluationId: string | undefined) {
  return useQuery({
    queryKey: ['evaluations', evaluationId, 'uploads'],
    queryFn: () => fetchUploads(evaluationId!),
    enabled: !!evaluationId,
  });
}

export function useUploadExcel(evaluationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadExcel(evaluationId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId, 'uploads'] });
    },
  });
}

export function useUploadExcelSkipErrors(evaluationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadExcelSkipErrors(evaluationId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId, 'uploads'] });
    },
  });
}

export function useRollbackUpload(evaluationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uploadId: string) => rollbackUpload(evaluationId, uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId, 'uploads'] });
    },
  });
}

export function useDownloadTemplate(evaluationId: string) {
  return useMutation({
    mutationFn: () => downloadTemplate(evaluationId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${evaluationId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
