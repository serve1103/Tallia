import { describe, it, expect, vi, beforeEach } from 'vitest';

// apiClient mock
vi.mock('../../../../shared/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from '../../../../shared/lib/api-client';
import {
  fetchTenants,
  fetchTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  fetchTenantUsers,
  removeTenantUser,
} from '../tenants';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Admin Tenants API', () => {
  it('fetchTenants — GET /admin/tenants', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { total: 0 } } });
    const result = await fetchTenants({ page: 1, limit: 20 });
    expect(mockGet).toHaveBeenCalledWith('/admin/tenants', { params: { page: 1, limit: 20 } });
    expect(result).toEqual({ data: [], meta: { total: 0 } });
  });

  it('fetchTenant — GET /admin/tenants/:id', async () => {
    const tenant = { id: 't1', name: 'Test Uni' };
    mockGet.mockResolvedValue({ data: { data: tenant } });
    const result = await fetchTenant('t1');
    expect(mockGet).toHaveBeenCalledWith('/admin/tenants/t1');
    expect(result).toEqual(tenant);
  });

  it('createTenant — POST /admin/tenants', async () => {
    const input = { name: 'New Uni', allowedDomains: ['uni.ac.kr'], inviteCode: 'UNI2026', dataRetentionYears: 5 };
    mockPost.mockResolvedValue({ data: { data: { id: 't2', ...input } } });
    const result = await createTenant(input);
    expect(mockPost).toHaveBeenCalledWith('/admin/tenants', input);
    expect(result.id).toBe('t2');
  });

  it('updateTenant — POST /admin/tenants/:id/update', async () => {
    mockPost.mockResolvedValue({ data: { data: { id: 't1', name: 'Updated' } } });
    const result = await updateTenant('t1', { name: 'Updated' });
    expect(mockPost).toHaveBeenCalledWith('/admin/tenants/t1/update', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('deleteTenant — POST /admin/tenants/:id/delete', async () => {
    mockPost.mockResolvedValue({ data: { data: { success: true } } });
    await deleteTenant('t1');
    expect(mockPost).toHaveBeenCalledWith('/admin/tenants/t1/delete');
  });

  it('fetchTenantUsers — GET /admin/tenants/:id/users', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 'u1' }], meta: { total: 1 } } });
    const result = await fetchTenantUsers('t1', { page: 1, limit: 20 });
    expect(mockGet).toHaveBeenCalledWith('/admin/tenants/t1/users', { params: { page: 1, limit: 20 } });
    expect(result.data).toHaveLength(1);
  });

  it('removeTenantUser — POST /admin/tenants/:id/users/:userId/remove', async () => {
    mockPost.mockResolvedValue({ data: { data: { success: true } } });
    await removeTenantUser('t1', 'u1');
    expect(mockPost).toHaveBeenCalledWith('/admin/tenants/t1/users/u1/remove');
  });
});
