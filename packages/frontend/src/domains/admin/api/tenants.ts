import { apiClient } from '../../../shared/lib/api-client';
import type { Tenant, User } from '@tallia/shared';

interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page?: number; limit?: number };
}

interface CreateTenantInput {
  name: string;
  allowedDomains: string[];
  inviteCode: string;
  dataRetentionYears: number;
}

export async function fetchTenants(params: PaginationParams): Promise<PaginatedResponse<Tenant>> {
  const { data } = await apiClient.get('/admin/tenants', { params });
  return data;
}

export async function fetchTenant(tenantId: string): Promise<Tenant> {
  const { data } = await apiClient.get(`/admin/tenants/${tenantId}`);
  return data.data;
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const { data } = await apiClient.post('/admin/tenants', input);
  return data.data;
}

export async function updateTenant(tenantId: string, input: Partial<CreateTenantInput>): Promise<Tenant> {
  const { data } = await apiClient.post(`/admin/tenants/${tenantId}/update`, input);
  return data.data;
}

export async function deleteTenant(tenantId: string): Promise<void> {
  await apiClient.post(`/admin/tenants/${tenantId}/delete`);
}

export async function fetchTenantUsers(
  tenantId: string,
  params: PaginationParams,
): Promise<PaginatedResponse<User>> {
  const { data } = await apiClient.get(`/admin/tenants/${tenantId}/users`, { params });
  return data;
}

export async function removeTenantUser(tenantId: string, userId: string): Promise<void> {
  await apiClient.post(`/admin/tenants/${tenantId}/users/${userId}/remove`);
}
