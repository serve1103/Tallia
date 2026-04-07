# 6. 인증 / 멀티테넌트

### 6.1 인증 흐름

```
[회원가입]
  1. 이메일 도메인이 특정 tenant의 allowed_domains에 포함? → 해당 테넌트 자동 배정
  2. 아니면 invite_code 입력 → 해당 테넌트 배정
  3. 이메일 인증 발송 → 인증 완료 후 로그인 가능

[로그인]
  1. email + password 검증
  2. JWT 발급: { sub: userId, tenantId, role, iat, exp }
  3. Access Token: 1시간, Refresh Token: 7일

[토큰 갱신]
  Refresh Token → 새 Access Token + Refresh Token (Rotation)
```

### 6.2 JWT 구조

```jsonc
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",  // null이면 platform_admin
  "role": "tenant_admin",
  "iat": 1706000000,
  "exp": 1706003600
}
```

### 6.3 TenantGuard

```typescript
// packages/backend/src/common/guards/tenant.guard.ts

@Injectable()
class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;  // JWT에서 추출

    // platform_admin은 모든 테넌트 접근 가능
    if (user.role === 'platform_admin') return true;

    // tenant_admin은 자기 테넌트만
    const tenantId = this.extractTenantId(request);
    return user.tenantId === tenantId;
  }
}
```

**자동 tenant_id 주입:**
모든 테넌트 범위 서비스에서 `@CurrentTenant()` 데코레이터로 tenant_id를 자동 주입:

```typescript
@Controller('evaluations')
@UseGuards(JwtAuthGuard, TenantGuard)
class EvaluationsController {
  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.service.findAll(tenantId);  // WHERE tenant_id = :tenantId 자동 적용
  }
}
```

### 6.4 역할별 접근 제어

```typescript
@Injectable()
class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    const { role } = context.switchToHttp().getRequest().user;
    return requiredRoles.includes(role);
  }
}

// 사용
@Roles('platform_admin')
@Post()
createTenant() { /* ... */ }
```

| API 그룹 | 허용 역할 |
|----------|-----------|
| /admin/** | platform_admin |
| /evaluations/** | tenant_admin |
| /auth/** | 인증 불필요 |

### 6.5 비밀번호 보안

- 해싱: bcrypt (salt rounds: 12)
- 최소 길이: 8자
- 복잡도: 영문 + 숫자 필수
