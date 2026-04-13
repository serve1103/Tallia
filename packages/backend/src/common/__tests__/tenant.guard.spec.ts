import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from '../guards/tenant.guard';

function createContext(user: unknown, params: Record<string, string> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, params }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('TenantGuard', () => {
  const guard = new TenantGuard();

  it('user가 없으면 통과 (JwtAuthGuard가 먼저 처리)', () => {
    expect(guard.canActivate(createContext(undefined))).toBe(true);
  });

  it('platform_admin은 모든 테넌트 접근 가능', () => {
    const user = { sub: 'u1', tenantId: null, role: 'platform_admin' };
    expect(guard.canActivate(createContext(user, { tenantId: 'any-tenant' }))).toBe(true);
  });

  it('tenant_admin은 자기 테넌트만 접근', () => {
    const user = { sub: 'u1', tenantId: 't1', role: 'tenant_admin' };
    expect(guard.canActivate(createContext(user, { tenantId: 't1' }))).toBe(true);
  });

  it('tenant_admin이 다른 테넌트 접근 → ForbiddenException', () => {
    const user = { sub: 'u1', tenantId: 't1', role: 'tenant_admin' };
    expect(() => guard.canActivate(createContext(user, { tenantId: 't2' }))).toThrow(ForbiddenException);
  });

  it('tenantId 파라미터가 없으면 통과', () => {
    const user = { sub: 'u1', tenantId: 't1', role: 'tenant_admin' };
    expect(guard.canActivate(createContext(user))).toBe(true);
  });
});
