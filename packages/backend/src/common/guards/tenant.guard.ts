import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PLATFORM_ADMIN } from '@tallia/shared';

import type { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) return true; // JwtAuthGuard가 먼저 처리

    // platform_admin은 모든 테넌트 접근 가능
    if (user.role === PLATFORM_ADMIN) return true;

    // tenant_admin은 자기 테넌트만
    const tenantId = this.extractTenantId(request);
    if (tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('다른 대학의 데이터에 접근할 수 없습니다');
    }

    return true;
  }

  private extractTenantId(request: { params?: Record<string, string> }): string | null {
    return request.params?.tenantId ?? null;
  }
}
