# 6. 백엔드 아키텍처

### 6.1 기술 스택

| 영역 | 기술 | 근거 |
|------|------|------|
| 런타임 | Node.js | 프론트엔드와 언어 통일 (TypeScript) |
| 프레임워크 | NestJS | 모듈 구조, DI, Guard/Interceptor/Pipe 생태계 |
| ORM | Prisma | 스키마 기반 타입 생성, JSONB 지원, 파라미터 바인딩 (SQL Injection 방지) |
| DB | PostgreSQL | JSONB, 배열 타입, TOAST 압축 |
| 검증 | Zod + ZodValidationPipe | `@tallia/shared` 스키마를 프론트/백 공유 |
| 엑셀 | ExcelJS | 스트리밍 모드, 양식 생성/파싱/내보내기 |
| 수식 샌드박스 | mathjs | AST 화이트리스트, 100ms 타임아웃 |
| 인증 | @nestjs/jwt + @nestjs/passport | JWT 발급/검증 |
| 해싱 | bcrypt (salt rounds 12) | 비밀번호 단방향 암호화 |
| Rate Limiting | @nestjs/throttler | IP/사용자 기준 요청 제한 |
| 보안 헤더 | helmet | CSP, HSTS, X-Frame-Options 등 |
| 프로세스 관리 | PM2 | 클러스터 모드, 자동 재시작 |

### 6.2 레이어드 아키텍처

3계층 레이어드 아키텍처 + Repository 패턴(DIP)을 적용한다.

```
┌─────────────────────────────────┐
│  Presentation                   │  Controller
├─────────────────────────────────┤
│  Business                       │  Application → Service
│                                 │       ↓
│                                 │  Repository (Interface)
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│  Data Source                    │  Repository Implementation (Prisma)
└─────────────────────────────────┘
```

| 계층 | 역할 | 의존 방향 |
|------|------|-----------|
| Controller | HTTP 요청/응답 처리, 입력 검증 위임 | → Application |
| Application | Use case 조합, 트랜잭션 경계 | → Service |
| Service | 비즈니스 로직, 도메인 규칙 | → Repository (Interface) |
| Repository (Interface) | 데이터 접근 추상화 | ← Repository Impl |
| Repository Impl | Prisma 기반 실제 DB 접근 | Prisma Client |

**핵심 원칙:**
- Service는 Repository **인터페이스**에만 의존 — Prisma를 직접 호출하지 않음
- DB 교체/테스트 시 Repository Impl만 교체하면 됨
- NestJS DI로 인터페이스 → 구현체 바인딩

### 6.3 디렉토리 구조

```
packages/backend/src/
├── main.ts                        → 6.4 서버 부트스트랩
├── app.module.ts
├── common/                        → 6.5 공통 인프라
│   ├── guards/
│   ├── decorators/
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
├── auth/                          → [09-security.md §9.2]
│   ├── controller/
│   │   └── auth.controller.ts
│   ├── application/
│   │   └── auth.application.ts
│   ├── service/
│   │   └── auth.service.ts
│   ├── repository/
│   │   └── auth.repository.ts          # Interface
│   └── repository-impl/
│       └── auth.prisma.repository.ts   # Prisma 구현
├── tenants/                       → [03-api.md §3.3]
│   ├── controller/
│   ├── application/
│   ├── service/
│   ├── repository/
│   └── repository-impl/
├── users/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   └── repository-impl/
├── evaluations/                   → [03-api.md §3.4~3.6]
│   ├── controller/
│   │   └── evaluations.controller.ts
│   ├── application/
│   │   └── evaluations.application.ts
│   ├── service/
│   │   ├── evaluations.service.ts
│   │   └── config-handlers/       # 유형별 설정 핸들러
│   │       ├── type-a.handler.ts
│   │       ├── type-b.handler.ts
│   │       ├── type-c.handler.ts
│   │       └── type-d.handler.ts
│   ├── repository/
│   │   └── evaluations.repository.ts
│   └── repository-impl/
│       └── evaluations.prisma.repository.ts
├── pipeline/                      → [04-pipeline-engine.md]
│   ├── blocks/
│   │   ├── common/
│   │   ├── type-a/
│   │   ├── type-b/
│   │   ├── type-c/
│   │   ├── type-d/
│   │   └── custom/
│   ├── pipeline-executor.ts
│   ├── pipeline-validator.ts
│   └── block-registry.ts
├── excel/                         → [05-excel.md]
│   ├── controller/
│   ├── application/
│   ├── service/
│   │   ├── template-generator.ts
│   │   ├── upload-parser.ts
│   │   └── result-exporter.ts
│   ├── repository/
│   └── repository-impl/
├── scores/                        → [03-api.md §3.8~3.9]
│   ├── controller/
│   ├── application/
│   ├── service/
│   ├── repository/
│   └── repository-impl/
├── mapping-tables/                → [03-api.md §3.10]
│   ├── controller/
│   ├── service/
│   ├── repository/
│   └── repository-impl/
└── audit/                         → [09-security.md §9.7]
    ├── service/
    ├── repository/
    └── repository-impl/
```

> pipeline/ 모듈은 블록 레지스트리 패턴을 사용하므로 일반적인 CRUD 레이어 구조를 따르지 않는다. 상세는 [04-pipeline-engine.md](04-pipeline-engine.md) 참조.

### 6.4 서버 부트스트랩 (main.ts)

NestJS 앱 초기화 시 적용되는 전역 설정:

```
1. Helmet (보안 헤더)
2. CORS (프론트엔드 도메인만 허용, GET/POST만)
3. Body 크기 제한 (JSON/URL-encoded: 10MB)
4. Cookie Parser (Refresh Token)
5. Trust Proxy (리버스 프록시 IP 추출)
6. 전역 Pipe: ZodValidationPipe
7. 전역 Filter: GlobalExceptionFilter
8. 전역 Guard 적용 순서:
   ThrottlerGuard → JwtAuthGuard → TenantGuard → RolesGuard
```

> 각 항목의 상세 설정은 [09-security.md](09-security.md) §9.1 참조

### 6.5 공통 인프라 (common/)

| 분류 | 구성 요소 | 역할 | 상세 |
|------|-----------|------|------|
| Guard | JwtAuthGuard | JWT 토큰 검증 | [§9.2](09-security.md) |
| Guard | TenantGuard | tenant_id 기반 멀티테넌트 격리 | [§9.3](09-security.md) |
| Guard | RolesGuard | `@Roles()` 기반 역할 접근 제어 | [§9.3](09-security.md) |
| Decorator | @CurrentUser | JWT에서 사용자 정보 추출 | — |
| Decorator | @CurrentTenant | JWT에서 tenant_id 추출, 쿼리 자동 주입 | — |
| Decorator | @Roles | 허용 역할 메타데이터 설정 | — |
| Interceptor | AuditLogInterceptor | 데이터 접근/수정/다운로드 감사 로그 자동 기록 | [§9.7](09-security.md) |
| Filter | GlobalExceptionFilter | 에러 응답 표준화, PII/스택 트레이스 노출 차단 | [§9.5](09-security.md) |
| Pipe | ZodValidationPipe | Zod 스키마 기반 입력 검증 | [§9.6](09-security.md) |

### 6.6 모듈 의존 관계

```
AppModule
├── AuthModule
├── TenantsModule
├── UsersModule
├── EvaluationsModule ──→ PipelineModule
│                    ──→ ExcelModule
│                    ──→ MappingTablesModule
├── ScoresModule ──────→ PipelineModule
│                    ──→ ExcelModule
└── AuditModule (전역 Interceptor — 모든 모듈에서 사용)
```

- 화살표 방향이 import 의존 방향
- AuditModule은 전역 Interceptor로 등록되어 별도 import 없이 모든 모듈에 적용
- PipelineModule과 ExcelModule은 EvaluationsModule, ScoresModule이 공유

### 6.7 요청 처리 흐름

하나의 API 요청이 처리되는 전체 과정:

```
Client Request
    │
    ▼
ThrottlerGuard ──── Rate Limit 초과 시 429 반환
    │
    ▼
JwtAuthGuard ────── 토큰 무효 시 401 반환
    │
    ▼
TenantGuard ─────── 타 테넌트 접근 시 403 반환
    │
    ▼
RolesGuard ──────── 권한 불충분 시 403 반환
    │
    ▼
AuditLogInterceptor (before) ── 요청 정보 캡처
    │
    ▼
ZodValidationPipe ── 입력 검증 실패 시 400 반환
    │
    ▼
Controller ──→ Application ──→ Service ──→ Repository Interface
                                                    │
                                          Repository Impl (Prisma)
                                                    │
                                                    ▼
                                               PostgreSQL
    │
    ▼
AuditLogInterceptor (after) ── 감사 로그 기록
    │
    ▼
GlobalExceptionFilter ── 예외 발생 시 표준 에러 응답
    │
    ▼
Client Response
```

### 6.8 핵심 설계 결정

| 결정 | 선택 | 근거 | 상세 |
|------|------|------|------|
| JSONB vs 정규화 | 구조가 유형별로 다르면 JSONB, 검색/정렬 필요하면 정규화 | evaluation config는 A/B/C/D별로 완전히 다른 구조 | [§2.6](02-db-schema.md) |
| HTTP 메서드 | GET + POST만 사용 | 보안 정책. 변경 작업은 POST + 명시적 경로 | [§3.1](03-api.md) |
| 계산 실행 | MVP: 동기 실행 | 1,000행 10초 이내 가능. 비동기(Bull Queue)는 확장 시 전환 | [§8.1](08-nfr.md) |
| 원본 데이터 저장 | raw_data JSONB (파일 미저장) | MVP 단순화. 파일 저장은 Phase 2 검토 | [§8 미결사항](08-nfr.md) |
| 블록 실행 패턴 | BlockRegistry + 순차 실행 | 블록 추가 시 Registry에 등록만 하면 됨 (OCP) | [§4.3](04-pipeline-engine.md) |
| 수식 샌드박스 | mathjs AST 화이트리스트 + 100ms 타임아웃 | 코드 인젝션 방지 | [§4.10](04-pipeline-engine.md) |
| 테넌트 격리 | JWT tenant_id + TenantGuard + WHERE 조건 3중 | 다른 대학 데이터 접근 원천 차단 | [§9.3](09-security.md) |
| 삭제 방식 | Hard Delete + CASCADE | 개인정보 보호법 — 복구 불가능한 완전 삭제 | [§9.8](09-security.md) |

### 6.9 상세 문서

| 문서 | 내용 |
|------|------|
| [02-db-schema.md](02-db-schema.md) | 7개 테이블, JSONB 구조, 인덱스 전략 |
| [03-api.md](03-api.md) | RESTful /api/v1, ~40개 엔드포인트, 요청/응답 예시 |
| [04-pipeline-engine.md](04-pipeline-engine.md) | DataShape, 블록 인터페이스, A/B/C/D 블록 상세, 유효성 검증 |
| [05-excel.md](05-excel.md) | 양식 자동생성, 업로드 파싱/검증, 결과 다운로드 |
| [09-security.md](09-security.md) | 인증/인가, Rate Limiting, 에러 처리, 감사 로그, 개인정보 보호 |
