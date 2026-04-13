import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import type { JwtPayload } from '../decorators/current-user.decorator';

/**
 * 감사 로그 인터셉터 — before/after 구조.
 * 실제 DB 기록은 Phase 10 (AuditModule 연동 후) 구현.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    const method = request.method;
    const path = request.url;

    // before: 요청 정보 캡처
    const auditContext = {
      userId: user?.sub,
      tenantId: user?.tenantId,
      method,
      path,
      timestamp: new Date().toISOString(),
    };

    return next.handle().pipe(
      tap(() => {
        // after: 감사 로그 기록 (Phase 10에서 AuditService 호출로 교체)
        void auditContext;
      }),
    );
  }
}
