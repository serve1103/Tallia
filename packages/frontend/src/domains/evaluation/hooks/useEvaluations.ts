import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EvaluationType } from '@tallia/shared';
import {
  fetchEvaluations,
  fetchEvaluation,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  copyEvaluation,
  fetchEvalConfig,
  saveEvalConfig,
} from '../api/evaluations';

interface EvalFilters {
  page: number;
  limit: number;
  type?: EvaluationType;
  academicYear?: string;
  admissionType?: string;
}

export function useEvaluations(filters: EvalFilters) {
  return useQuery({
    queryKey: ['evaluations', filters],
    queryFn: () => fetchEvaluations(filters),
  });
}

export function useEvaluation(id: string | undefined) {
  return useQuery({
    queryKey: ['evaluations', id],
    queryFn: () => fetchEvaluation(id!),
    enabled: !!id,
  });
}

export function useEvalConfig(id: string | undefined) {
  return useQuery({
    queryKey: ['evaluations', id, 'config'],
    queryFn: () => fetchEvalConfig(id!),
    enabled: !!id,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, unknown>) =>
      updateEvaluation(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

export function useCopyEvaluation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: copyEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
  });
}

export function useSaveEvalConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: unknown }) =>
      saveEvalConfig(id, config),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations', variables.id] });
    },
  });
}
