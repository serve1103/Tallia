import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTenants,
  fetchTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  fetchTenantUsers,
  removeTenantUser,
} from '../api/tenants';

export function useTenants(page: number, limit: number) {
  return useQuery({
    queryKey: ['admin', 'tenants', { page, limit }],
    queryFn: () => fetchTenants({ page, limit }),
  });
}

export function useTenant(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'tenants', tenantId],
    queryFn: () => fetchTenant(tenantId!),
    enabled: !!tenantId,
  });
}

export function useTenantUsers(tenantId: string | undefined, page: number, limit: number) {
  return useQuery({
    queryKey: ['admin', 'tenants', tenantId, 'users', { page, limit }],
    queryFn: () => fetchTenantUsers(tenantId!, { page, limit }),
    enabled: !!tenantId,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, ...input }: { tenantId: string } & Record<string, unknown>) =>
      updateTenant(tenantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
}

export function useRemoveTenantUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: string; userId: string }) =>
      removeTenantUser(tenantId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants', variables.tenantId, 'users'] });
    },
  });
}
