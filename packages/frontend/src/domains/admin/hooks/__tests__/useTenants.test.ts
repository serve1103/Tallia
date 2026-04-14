import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../api/tenants', () => ({
  fetchTenants: vi.fn(),
  fetchTenant: vi.fn(),
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
  deleteTenant: vi.fn(),
}));

import { fetchTenants, fetchTenant, createTenant, updateTenant, deleteTenant } from '../../api/tenants';
import { useTenants, useTenant, useCreateTenant, useUpdateTenant, useDeleteTenant } from '../useTenants';

const mockFetchTenants = vi.mocked(fetchTenants);
const mockFetchTenant = vi.mocked(fetchTenant);
const mockCreateTenant = vi.mocked(createTenant);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTenants', () => {
  it('테넌트 목록을 가져온다', async () => {
    const mockData = { data: [{ id: 't1', name: 'Uni A' }], meta: { total: 1 } };
    mockFetchTenants.mockResolvedValue(mockData as any);

    const { result } = renderHook(() => useTenants(1, 20), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockFetchTenants).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});

describe('useTenant', () => {
  it('개별 테넌트를 가져온다', async () => {
    const tenant = { id: 't1', name: 'Uni A' };
    mockFetchTenant.mockResolvedValue(tenant as any);

    const { result } = renderHook(() => useTenant('t1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(tenant);
  });

  it('id가 없으면 쿼리를 실행하지 않는다', () => {
    const { result } = renderHook(() => useTenant(undefined), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
    expect(mockFetchTenant).not.toHaveBeenCalled();
  });
});

describe('useCreateTenant', () => {
  it('테넌트 생성 mutation', async () => {
    const input = { name: 'New', allowedDomains: ['n.ac.kr'], inviteCode: 'N2026', dataRetentionYears: 5 };
    mockCreateTenant.mockResolvedValue({ id: 't2', ...input } as any);

    const { result } = renderHook(() => useCreateTenant(), { wrapper: createWrapper() });
    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCreateTenant.mock.calls[0][0]).toEqual(input);
  });
});
