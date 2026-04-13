import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';

function createContext(role: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { sub: 'u1', tenantId: 't1', role } }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('역할 제한 없으면 통과', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext('tenant_admin'))).toBe(true);
  });

  it('필요 역할에 포함되면 통과', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['platform_admin']);
    expect(guard.canActivate(createContext('platform_admin'))).toBe(true);
  });

  it('필요 역할에 미포함이면 거부', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['platform_admin']);
    expect(guard.canActivate(createContext('tenant_admin'))).toBe(false);
  });

  it('복수 역할 중 하나 일치하면 통과', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['platform_admin', 'tenant_admin']);
    expect(guard.canActivate(createContext('tenant_admin'))).toBe(true);
  });
});
