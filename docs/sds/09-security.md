# 9. 보안 설계

### 9.1 서버 보안 (main.ts)

| 항목 | 설정 | 근거 |
|------|------|------|
| HTTP 메서드 제한 | **GET과 POST만 허용** | 보안 정책. §3.1 참조 |
| Helmet | `app.use(helmet())` 기본 설정 | 보안 헤더 (CSP, HSTS, X-Frame-Options 등) |
| X-Powered-By 제거 | `express.disable('x-powered-by')` | 서버 기술 스택 노출 방지 |
| Trust Proxy | `express.set('trust proxy', env.TRUST_PROXY \|\| 'loopback')` | 리버스 프록시 뒤 정확한 IP 추출 |
| CORS | origin: `env.FRONTEND_ORIGIN`, credentials: true, methods: `['GET', 'POST']` | 프론트엔드 도메인만 허용, 쿠키 전송 허용 |
| Body 크기 제한 | JSON/URL-encoded: `10mb` | 엑셀 업로드 최대 10MB 수용 |
| 쿠키 파서 | `cookie-parser` | httpOnly 쿠키 기반 Refresh Token 파싱 |
| HTTPS | 리버스 프록시(nginx) TLS 종료 | 전송 구간 암호화 |

### 9.2 인증

#### 회원가입 흐름

```
1. 이메일 도메인이 특정 tenant의 allowed_domains에 포함? → 해당 테넌트 자동 배정
2. 아니면 invite_code 입력 → 해당 테넌트 배정
3. 이메일 인증 발송 → 인증 완료 후 로그인 가능
```

#### JWT 토큰

| 항목 | 설정 |
|------|------|
| Access Token | 1시간 만료 |
| Refresh Token | 7일 만료, **httpOnly 쿠키** 저장 |
| 토큰 갱신 | Refresh Token Rotation (갱신 시 이전 RT 폐기) |

```jsonc
// JWT Payload
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",  // null이면 platform_admin
  "role": "tenant_admin",
  "iat": 1706000000,
  "exp": 1706003600
}
```

#### 비밀번호

- 해싱: bcrypt (salt rounds: 12)
- 최소 길이: 8자
- 복잡도: 영문 + 숫자 필수

### 9.3 인가 (멀티테넌트 격리)

#### TenantGuard

```typescript
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

#### RolesGuard

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
```

| API 그룹 | 허용 역할 |
|----------|-----------|
| /admin/** | platform_admin |
| /evaluations/** | tenant_admin |
| /auth/** | 인증 불필요 |

### 9.4 Rate Limiting

`@nestjs/throttler` 모듈, Guard 레벨 적용.

| 대상 | 제한 | 근거 |
|------|------|------|
| /auth/login | 5회 / 분 (IP 기준) | 브루트포스 방지 |
| /auth/signup | 3회 / 분 (IP 기준) | 계정 남용 방지 |
| 일반 API | 100회 / 분 (사용자 기준) | 서비스 안정성 |

### 9.5 에러 처리 (GlobalExceptionFilter)

| 예외 유형 | 응답 | 원칙 |
|-----------|------|------|
| 비즈니스 예외 (AppException) | 정의된 code + message | 클라이언트에 의미 있는 오류 전달 |
| HttpException | HTTP status 기반 code 생성 | NestJS 기본 예외 호환 |
| 기타 (알 수 없는 예외) | 500 INTERNAL_ERROR | **내부 정보 노출 절대 금지** |

**금지 사항:**
- 에러 메시지에 수험생 PII (수험번호, 성명, 점수) 포함 금지
- 스택 트레이스 클라이언트 노출 금지 (production)
- DB 쿼리 오류 원문 노출 금지

### 9.6 입력 검증

| 항목 | 방식 | 근거 |
|------|------|------|
| API 입력 | Zod 스키마 + ZodValidationPipe | 프론트/백 공유 검증 |
| SQL Injection | Prisma 파라미터 바인딩 (raw query 금지) | ORM 레벨 방어 |
| XSS | React 기본 이스케이프 + Helmet CSP | 프론트엔드 레벨 방어 |
| 사용자 정의 수식 | mathjs 샌드박스, AST 화이트리스트, 100ms 타임아웃 | 코드 인젝션 방지 |

### 9.7 감사 로그 보안

- 감사 로그에 PII **값** 기록 금지 (필드명만 기록)
  - 예: `{ action: "data_view", fieldNames: ["examinee_no", "score"] }` (값 미포함)
- 감사 로그는 **Append-Only** — UPDATE/DELETE 불가
- 채점 결과 검증용 로그 자동 기록 (B유형 auto_grade)

### 9.8 개인정보 보호

수험생 데이터(수험번호, 성명, 점수)는 개인정보 보호법 적용 대상.

| 항목 | 정책 |
|------|------|
| 데이터 보관 기간 | 대학별 설정 (기본 3년, 고등교육법 시행령 제35조) |
| 파기 방식 | **완전 삭제** (soft delete 미사용, CASCADE) |
| 접근 로그 | 모든 데이터 조회/수정/다운로드에 감사 로그 기록 |
| 다운로드 이력 | audit_logs action=`data_download` 자동 기록 |
| 위탁 구조 | 대학(위탁자) → Tallia(수탁자), 위탁 범위 내에서만 처리 |
| 개인정보처리방침 | 서비스 배포 시 웹앱 내 페이지로 제공 (개인정보 보호법 제30조) |
