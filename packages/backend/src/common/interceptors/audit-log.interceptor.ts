import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, Optional } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import type { JwtPayload } from '../decorators/current-user.decorator';
import { AuditService } from '../../audit/service/audit.service';

/** POST 요청만 감사 로그 기록 (변경 작업) */
const AUDITABLE_METHODS = ['POST'];

/** PII 노출 방지: 감사 로그에 기록할 때 민감 필드 제외 */
const SENSITIVE_KEYS = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken'];

function sanitizeDetails(body: unknown, depth = 0): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object' || depth > 3) return undefined;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.includes(key)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeDetails(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(@Optional() @Inject(AuditService) private readonly auditService?: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    const method = request.method;
    const path = request.url;

    if (!AUDITABLE_METHODS.includes(method) || !user || !this.auditService) {
      return next.handle();
    }

    const resourceMatch = path.match(/\/evaluations\/([^/]+)/);
    const resourceId = resourceMatch?.[1] ?? '';
    const action = this.deriveAction(path, method);

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService!.log({
            tenantId: user.tenantId ?? '',
            userId: user.sub,
            action,
            resourceType: 'evaluation',
            resourceId,
            details: sanitizeDetails(request.body),
            ipAddress: request.ip ?? request.connection?.remoteAddress ?? '',
          }).catch(() => {
            // 감사 로그 실패가 비즈니스 로직을 중단하면 안 됨
          });
        },
      }),
    );
  }

  private deriveAction(path: string, method: string): string {
    if (path.includes('/delete')) return 'delete';
    if (path.includes('/copy')) return 'copy';
    if (path.includes('/update')) return 'update';
    if (path.includes('/save')) return 'save';
    if (path.includes('/upload')) return 'upload';
    if (path.includes('/rollback')) return 'rollback';
    if (path.includes('/calculate')) return 'calculate';
    if (method === 'POST') return 'create';
    return 'unknown';
  }
}
