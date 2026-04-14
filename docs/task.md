# Tallia — Implementation Task Plan

> PRD §10 구현 우선순위 + SDS 문서 기반 구현 계획.
> 각 Phase는 독립 배포 가능 단위. 체크박스로 진행 상황 추적.

## Phase 0: 모노레포 초기화

> 참조: [01-monorepo.md](sds/01-monorepo.md) §1.1, §1.3, §1.4

- [x] 루트 `package.json` (npm workspaces: `packages/*`, devDependencies: concurrently)
- [x] `tsconfig.base.json` (strict, ES2022, paths: `@tallia/shared`)
- [x] `.eslintrc.cjs` (@typescript-eslint, import/order, import/no-restricted-paths)
- [x] `.prettierrc` (2 spaces, single quotes, trailing comma)
- [x] `.gitignore` (node_modules, dist, .env, prisma/migrations)
- [x] `.env.example` (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_ORIGIN, TRUST_PROXY, PORT)
- [x] 루트 scripts (dev, build, lint, test, db:migrate, db:seed)
- [x] `npm install` 루트에서 실행 확인

## Phase 1: Shared 패키지

> 참조: [01-monorepo.md](sds/01-monorepo.md) §1.1, [02-db-schema.md](sds/02-db-schema.md) §2.3~2.4, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.1~4.2

- [x] `packages/shared/package.json` + `tsconfig.json`
- [x] `src/types/user.ts` — User, Role
- [x] `src/types/tenant.ts` — Tenant
- [x] `src/types/evaluation.ts` — EvaluationType, EvalConfig 유니온 (A/B/C/D 전 필드 반영)
- [x] `src/types/pipeline.ts` — BlockDef, DataShape, PipelineConfig
- [x] `src/types/score.ts` — Score, ScoreUpload (rawData 포함), CalculateResult
- [x] `src/types/mapping-table.ts` — MappingTable, MappingTableEntry
- [x] `src/types/audit-log.ts` — AuditLog, AuditAction
- [x] `src/constants/roles.ts` — PLATFORM_ADMIN, TENANT_ADMIN (user.ts ROLES 참조)
- [x] `src/constants/block-types.ts` — 04-pipeline-engine.md §4.5~4.10 기준 전체 블록 열거
- [x] `src/validators/pipeline.ts` — validatePipeline() 6개 규칙 구현
- [x] `src/index.ts` — 배럴 export
- [x] `npm run build -w shared` 타입 에러 없이 통과

## Phase 2: Backend 기반

> 참조: [06-backend.md](sds/06-backend.md), [02-db-schema.md](sds/02-db-schema.md), [09-security.md](sds/09-security.md)

### 2-A. 패키지 초기화
- [x] `packages/backend/package.json` + `tsconfig.json`
- [x] NestJS 의존성 설치 (core, common, jwt, passport, throttler, prisma, bcrypt, helmet, cookie-parser, zod)
- [x] `@tallia/shared` 의존성 연결

### 2-B. Prisma 스키마
> 참조: [02-db-schema.md](sds/02-db-schema.md) §2.2, §2.5

- [x] `prisma/schema.prisma` — provider: postgresql
- [x] 모델 정의 (8개):
  - [x] Tenant (allowed_domains: String[], invite_code, data_retention_years)
  - [x] User (tenant_id nullable, role, password_hash)
  - [x] Evaluation (config: Json, pipeline_config: Json, default_decimal: Json, needs_recalculation)
  - [x] ScoreUpload (raw_data: Json, is_current)
  - [x] Score (intermediate_results: Json, fail_flag, error_flag)
  - [x] MappingTable + MappingTableEntry
  - [x] AuditLog (append-only)
- [x] 인덱스 정의 (§2.5)
- [x] `prisma validate` 통과
- [ ] `prisma generate` 실행 (DB 연결 후)
- [ ] 초기 마이그레이션 (`prisma migrate dev --name init`) (DB 연결 후)

### 2-C. 공통 인프라 (common/)
> 참조: [06-backend.md](sds/06-backend.md) §6.4~6.5, [09-security.md](sds/09-security.md)

- [x] `guards/jwt-auth.guard.ts` — AuthGuard('jwt') 래핑
- [x] `guards/tenant.guard.ts` — §9.3 TenantGuard (platform_admin 통과)
- [x] `guards/roles.guard.ts` — §9.3 RolesGuard (Reflector + @Roles)
- [x] `decorators/current-user.decorator.ts` — @CurrentUser()
- [x] `decorators/current-tenant.decorator.ts` — @CurrentTenant()
- [x] `decorators/roles.decorator.ts` — @Roles()
- [x] `decorators/public.decorator.ts` — @Public() (JwtAuthGuard 바이패스)
- [x] `interceptors/audit-log.interceptor.ts` — before/after 구조 (실제 기록은 Phase 10)
- [x] `filters/global-exception.filter.ts` — §9.5 (PII/스택트레이스 노출 차단)
- [x] `pipes/zod-validation.pipe.ts` — Zod 스키마 기반 검증

### 2-D. Auth 모듈
> 참조: [03-api.md](sds/03-api.md) §3.2, [09-security.md](sds/09-security.md) §9.2

- [x] `auth/controller/auth.controller.ts` — 6개 엔드포인트:
  - [x] POST /auth/signup (도메인 이메일 → 테넌트 자동 배정 또는 invite_code)
  - [x] POST /auth/login (JWT 발급: AT 1h + RT 7d httpOnly 쿠키)
  - [x] POST /auth/refresh (RT Rotation: 기존 RT 폐기 → 새 AT/RT)
  - [x] POST /auth/verify-email (이메일 인증 확인)
  - [x] POST /auth/forgot-password (비밀번호 재설정 요청)
  - [x] POST /auth/reset-password (비밀번호 재설정)
- [x] `auth/application/auth.application.ts`
- [x] `auth/service/auth.service.ts` — bcrypt(12), JWT Payload: { sub, tenantId, role }
- [x] `auth/repository/auth.repository.ts` — Interface
- [x] `auth/repository-impl/auth.prisma.repository.ts`
- [x] Rate Limiting: login 5/min, signup 3/min (IP 기준)
- [ ] 이메일 발송 서비스 — stub 구현 (실제 발송은 인프라 확정 후, §8 미결사항)

### 2-E. Tenants 모듈
> 참조: [03-api.md](sds/03-api.md) §3.3

- [x] `tenants/controller/` — 7개 엔드포인트 (platform_admin 전용):
  - [x] POST /admin/tenants (생성)
  - [x] GET /admin/tenants (목록)
  - [x] GET /admin/tenants/:tenantId (상세)
  - [x] POST /admin/tenants/:tenantId/update (수정)
  - [x] POST /admin/tenants/:tenantId/delete (삭제)
  - [x] GET /admin/tenants/:tenantId/users (사용자 목록)
  - [x] POST /admin/tenants/:tenantId/users/:userId/remove (사용자 제거)
- [x] `tenants/application/` + `service/` + `repository/` + `repository-impl/`
- [x] `@Roles('platform_admin')` 적용

### 2-F. Users 모듈
- [x] `users/controller/` — GET /users/me, POST /users/me/update
- [x] `users/application/` + `service/` + `repository/` + `repository-impl/`

### 2-G. App Module + main.ts
> 참조: [06-backend.md](sds/06-backend.md) §6.4, §6.6

- [x] `app.module.ts` — AuthModule, TenantsModule, UsersModule import
- [x] `main.ts` 부트스트랩:
  - [x] Helmet (보안 헤더)
  - [x] CORS (origin: env.FRONTEND_ORIGIN, methods: GET/POST, credentials: true)
  - [x] Body limit 10mb
  - [x] cookie-parser
  - [x] trust proxy
  - [x] 전역 Guard 순서: ThrottlerGuard → JwtAuthGuard → TenantGuard → RolesGuard
  - [ ] 전역 Pipe: ZodValidationPipe (요청별 스키마 적용으로 변경)
  - [x] 전역 Filter: GlobalExceptionFilter
- [x] 헬스체크 엔드포인트 (GET /health)

### 2-H. DB 시딩
- [ ] `prisma/seed.ts` — 초기 platform_admin 계정 생성
- [ ] 테스트용 테넌트 + tenant_admin 계정

### 2-I. 검증
- [ ] `npm run build -w backend` 통과 (DB 연결 후)
- [ ] `npm run lint` 에러 없음
- [x] 단위 테스트: auth.service (signup, login, refresh) — 8개
- [x] 단위 테스트: tenant.guard, roles.guard — 9개

## Phase 3: Evaluations 모듈

> 참조: [03-api.md](sds/03-api.md) §3.4~3.5, [06-backend.md](sds/06-backend.md) §6.3

### 3-A. Backend — Evaluations CRUD
- [x] `evaluations/controller/evaluations.controller.ts` — 6개 엔드포인트:
  - [x] POST /evaluations (생성 — type, config, pipeline_config 포함)
  - [x] GET /evaluations (목록 — 필터: academic_year, admission_type, type)
  - [x] GET /evaluations/:id (상세 — config + pipeline_config 포함)
  - [x] POST /evaluations/:id/update (수정)
  - [x] POST /evaluations/:id/delete (삭제)
  - [x] POST /evaluations/:id/copy (복사 — Phase 10에서 상세 구현)
- [x] `evaluations/application/evaluations.application.ts`
- [x] `evaluations/service/evaluations.service.ts`
- [x] `evaluations/service/config-handlers/` — 유형별 설정 핸들러:
  - [x] type-a.handler.ts
  - [x] type-b.handler.ts
  - [x] type-c.handler.ts
  - [x] type-d.handler.ts
- [x] `evaluations/repository/evaluations.repository.ts` — Interface
- [x] `evaluations/repository-impl/evaluations.prisma.repository.ts`

### 3-B. Backend — Config 엔드포인트
> 참조: [03-api.md](sds/03-api.md) §3.5

- [x] GET /evaluations/:id/config (유형별 설정 조회)
- [x] POST /evaluations/:id/config/save (유형별 설정 저장)
- [x] GET /evaluations/:id/config/preview (샘플 미리보기 — 엔진 연동은 Phase 5)

### 3-C. app.module.ts 업데이트
- [x] EvaluationsModule import 추가

### 3-D. 검증
- [ ] 단위 테스트: evaluations.service (CRUD) — DB 연결 후
- [ ] 통합 테스트: evaluations API (생성 → 조회 → 수정 → 삭제) — DB 연결 후

## Phase 4: Frontend 기반

> 참조: [07-frontend.md](sds/07-frontend.md), [design-system.md](design/design-system.md)

### 4-A. 패키지 초기화
- [x] `packages/frontend/package.json` + `tsconfig.json`
- [x] Vite 설정 (React plugin, proxy /api → localhost:3000, @tallia/shared alias)
- [x] 의존성: react, react-dom, react-router-dom, antd, @ant-design/icons, axios, @tanstack/react-query, zustand, react-hook-form, @hookform/resolvers, zod, @tallia/shared

### 4-B. 디자인 시스템 적용
> 참조: [design-system.md](design/design-system.md) §7

- [x] `src/shared/theme/token.ts` — Ant Design ThemeConfig (§7 코드 그대로)
- [x] `src/shared/theme/index.ts` — theme export
- [x] `src/App.tsx` — ConfigProvider 래핑
- [x] Pretendard + Inter 폰트 로드 (index.html)

### 4-C. 공용 유틸
- [x] `src/shared/lib/api-client.ts` — axios 인스턴스:
  - [x] baseURL: `/api/v1`, withCredentials: true
  - [x] 요청 인터셉터: Bearer 토큰 자동 주입
  - [x] 응답 인터셉터: 401 수신 → POST /auth/refresh → 원래 요청 재시도 (1회)
- [x] `src/shared/lib/format.ts` — 숫자/날짜 포맷 유틸
- [x] `src/shared/lib/decimal.ts` — 소수점 처리 유틸 (@tallia/shared 래퍼)

### 4-D. 공용 레이아웃
> 참조: [design-system.md](design/design-system.md) §5.6~5.7

- [x] `src/shared/components/AppLayout.tsx` — Sider 260px (bg #f8f8fa) + Topbar 64px
- [x] `src/shared/components/AuthLayout.tsx` — 중앙 카드 레이아웃

### 4-E. Auth 도메인
> 참조: [07-frontend.md](sds/07-frontend.md) §7.2, §7.4

- [x] `src/domains/auth/stores/authStore.ts` — Zustand + persist
- [x] `src/domains/auth/api/auth.ts` — login, signup, logout, refresh API 함수
- [x] `src/domains/auth/hooks/useAuth.ts`
- [x] `src/domains/auth/components/LoginForm.tsx` — Ant Design Form
- [x] `src/domains/auth/components/SignupForm.tsx` — 이메일, 비밀번호, 이름, invite_code

### 4-F. Admin 도메인
- [x] `src/domains/admin/api/tenants.ts`
- [x] `src/domains/admin/hooks/useTenants.ts`
- [x] `src/domains/admin/components/TenantList.tsx`
- [x] `src/domains/admin/components/TenantDetail.tsx`

### 4-G. Evaluation 도메인 (기본)
- [x] `src/domains/evaluation/api/evaluations.ts`
- [x] `src/domains/evaluation/hooks/useEvaluations.ts`
- [x] `src/domains/evaluation/models/evaluation.ts` — 도메인 모델 변환, 뷰 모델

### 4-H. 라우팅 + 페이지
- [x] `src/routes/index.tsx` — React Router v7 라우트 정의
- [x] PrivateRoute (인증 여부 체크, 미인증 → /login 리다이렉트)
- [x] Auth 페이지:
  - [x] `src/routes/auth/LoginPage.tsx`
  - [x] `src/routes/auth/SignupPage.tsx`
- [ ] 메인 페이지:
  - [x] `src/routes/dashboard/DashboardPage.tsx` — 껍데기 (목록/필터 미구현)
  - [x] `src/routes/evaluation/CreatePage.tsx` — 껍데기
  - [x] `src/routes/evaluation/ConfigPage.tsx` — 유형별 설정
  - [x] `src/routes/evaluation/PipelinePage.tsx` — 계산 과정 설정
  - [x] `src/routes/evaluation/UploadPage.tsx` — 엑셀 업로드
- [x] 결과 페이지 (껍데기):
  - [x] `src/routes/results/ResultListPage.tsx`
  - [x] `src/routes/results/ResultDetailPage.tsx`
- [x] Admin 페이지:
  - [x] `src/routes/admin/TenantListPage.tsx` — 껍데기
  - [x] `src/routes/admin/TenantDetailPage.tsx`
- [x] 에러 페이지: 404 NotFoundPage
- [ ] ESLint `import/no-restricted-paths` 설정

### 4-I. 검증
- [ ] `npm run build -w frontend` 통과
- [ ] 로그인 페이지 렌더링 확인
- [ ] 대시보드 페이지 평가 목록 표시 확인
- [ ] 라우트 보호 (미인증 → 로그인 리다이렉트) 확인

## Phase 5: Pipeline 엔진 + 사용자 정의 단계

> 참조: [04-pipeline-engine.md](sds/04-pipeline-engine.md), [FSD.md](FSD.md)

### 5-A. Backend — 핵심 엔진
- [x] `pipeline/block-registry.ts` — 블록 등록/조회
- [x] `pipeline/pipeline-executor.ts` — 순차 실행, 블록별 소수점 처리
- [x] `pipeline/pipeline-validator.ts` — validatePipeline() 백엔드 버전

### 5-B. Backend — 공통 블록 (후처리 4종)
> 참조: [FSD.md](FSD.md) 후처리 단계

- [x] `pipeline/blocks/common/item-fail-check.ts` — 항목별 과락 판정
- [x] `pipeline/blocks/common/total-fail-check.ts` — 전체 과락 판정
- [x] `pipeline/blocks/common/normalize-to-max.ts` — 만점 기준 환산 (→ 원점수)
- [x] `pipeline/blocks/common/apply-converted-max.ts` — 환산 만점 적용 (→ 환산점수)

### 5-C. Backend — 사용자 정의 블록 (5종)
> 참조: [FSD.md](FSD.md) 사용자 정의 단계, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.10

- [x] `pipeline/blocks/custom/custom-bonus.ts` — 가산점 부여
- [x] `pipeline/blocks/custom/custom-ratio.ts` — 비율 조정
- [x] `pipeline/blocks/custom/custom-range-map.ts` — 구간 변환
- [x] `pipeline/blocks/custom/custom-clamp.ts` — 상한/하한 제한
- [x] `pipeline/blocks/custom/custom-formula.ts` — mathjs 샌드박스 (AST 화이트리스트)

### 5-D. Backend — Pipeline API
> 참조: [03-api.md](sds/03-api.md) §3.6

- [x] GET /evaluations/:id/pipeline (조회)
- [x] POST /evaluations/:id/pipeline/save (저장)
- [x] POST /evaluations/:id/pipeline/validate (유효성 검증)
- [x] POST /evaluations/:id/pipeline/preview (샘플 테스트 — stub)
- [x] app.module.ts에 PipelineModule import

### 5-E. Backend — Excel 모듈 골격
> 참조: [06-backend.md](sds/06-backend.md) §6.3, [05-excel.md](sds/05-excel.md)

- [x] `excel/controller/excel.controller.ts` — 4개 엔드포인트 (stub)
- [x] `excel/application/excel.application.ts`
- [x] `excel/service/template-generator.ts` — 양식 생성 (유형별 분기 구조)
- [x] `excel/service/upload-parser.ts` — 업로드 파싱 (유형별 분기 구조)
- [x] `excel/service/result-exporter.ts` — 결과 내보내기
- [x] `excel/repository/` + `repository-impl/`
- [x] app.module.ts에 ExcelModule import

### 5-F. Backend — Scores 모듈 골격
- [x] `scores/controller/scores.controller.ts` — 5개 엔드포인트 (stub)
- [x] `scores/application/` + `service/` + `repository/` + `repository-impl/`
- [x] app.module.ts에 ScoresModule import

### 5-G. Backend — Audit 모듈 골격
- [x] `audit/service/audit.service.ts`
- [x] `audit/repository/audit.repository.ts` — Interface
- [x] `audit/repository-impl/audit.prisma.repository.ts`
- [x] app.module.ts에 AuditModule import

### 5-H. Frontend — Pipeline 도메인
- [x] `domains/pipeline/components/PipelineBuilder.tsx` — 메인 빌더
- [x] `domains/pipeline/components/BlockPalette.tsx` — 유형별 필터
- [x] `domains/pipeline/components/BlockCard.tsx` — 개별 블록 카드
- [x] `domains/pipeline/components/BlockParamEditor.tsx` — Drawer 파라미터 편집
- [x] `domains/pipeline/components/ConditionalTabs.tsx` — A유형 위원 수별 탭
- [x] `domains/pipeline/components/ValidationBadge.tsx` — 실시간 유효성 표시
- [x] `domains/pipeline/components/PreviewPanel.tsx` — 샘플 미리보기
- [x] `domains/pipeline/stores/pipelineStore.ts` — 편집 상태
- [x] `domains/pipeline/hooks/usePipeline.ts`
- [x] `domains/pipeline/api/pipeline.ts`
- [x] `domains/pipeline/models/pipeline.ts` — 블록 헬퍼, 유효성 해석
- [x] @dnd-kit/core 드래그앤드롭 통합
- [x] PipelinePage.tsx 연동

### 5-I. 검증
- [x] 단위 테스트: pipeline-executor (블록 순차 실행, 소수점 처리) — 4개
- [x] 단위 테스트: pipeline-validator (호환성 검증) — shared 9개
- [x] 단위 테스트: custom-formula (샌드박스 보안 — 금지된 함수 차단 확인) — 4개
- [ ] 통합 테스트: pipeline API (저장 → 검증 → 미리보기) — DB 연결 후

## Phase 6: A. 위원 평가

> 참조: [FSD.md](FSD.md) §A, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.5, [05-excel.md](sds/05-excel.md)

### 6-A. Backend — A유형 블록
- [x] `pipeline/blocks/type-a/` — 블록 구현 (스펙 §4.5 기준 18개):
  - [x] 전처리: grade_to_score
  - [x] path1: sum_by_committee, weighted_sum_by_committee, add_virtual_committee, exclude_max_committee, exclude_min_committee, committee_average, committee_sum
  - [x] path2: add_virtual_per_item, exclude_max_per_item, exclude_min_per_item, average_per_item, sum_per_item, apply_weight, sub_to_parent_sum, sub_to_parent_weighted, item_sum, item_average
- [ ] A유형 조건부 실행 (위원 수별 파이프라인 분기) — executor 연동 필요
- [ ] Evaluation config 핸들러 (A유형) 상세 구현 — stub만 존재

### 6-B. Backend — A유형 엑셀
> 참조: [05-excel.md](sds/05-excel.md) §5.2

- [ ] A유형 양식 자동생성 (항목×위원 동적 열, 등급/점수 분기)
- [ ] A유형 업로드 파싱 + 검증
- [x] Excel API 엔드포인트 (stub):
  - [x] GET /evaluations/:id/excel/template
  - [x] POST /evaluations/:id/excel/upload
  - [x] GET /evaluations/:id/excel/uploads
  - [x] POST /evaluations/:id/excel/rollback/:uploadId

### 6-C. Frontend
- [x] `domains/evaluation/components/TypeAConfigForm.tsx`
- [x] `domains/excel/components/UploadDropzone.tsx`
- [x] `domains/excel/components/ValidationPreview.tsx`
- [x] `domains/excel/components/UploadHistory.tsx`
- [x] `domains/excel/hooks/useExcel.ts`
- [x] `domains/excel/api/excel.ts`
- [x] UploadPage.tsx 연동

### 6-D. 검증
- [x] 단위 테스트: A유형 블록 (각 블록 입출력) — 9개
- [ ] 단위 테스트: A유형 조건부 실행 (위원 수 분기)
- [ ] 통합 테스트: A유형 전체 흐름 — DB 연결 후

## Phase 7: D. 점수 변환표

> 참조: [FSD.md](FSD.md) §D, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.8, [03-api.md](sds/03-api.md) §3.10

### 7-A. Backend
- [x] `pipeline/blocks/type-d/mapping_lookup.ts` — 구간/정확 매칭 구현
- [x] 매칭 실패 error_flag 처리 (failFlags 반환)
- [x] MappingTable API (§3.10) — stub:
  - [x] GET /evaluations/:id/mapping-table
  - [x] POST /evaluations/:id/mapping-table/save
  - [x] POST /evaluations/:id/mapping-table/upload
  - [x] GET /evaluations/:id/mapping-table/download
- [ ] D유형 엑셀 양식 생성 + 업로드 파싱
- [x] MappingTablesModule → app.module.ts

### 7-B. Frontend
- [x] `domains/evaluation/components/TypeDConfigForm.tsx`
- [ ] 매핑 테이블 화면 직접 편집 UI

### 7-C. 검증
- [x] 단위 테스트: mapping_lookup (구간 매칭, 정확 매칭, 실패 케이스) — 3개

## Phase 8: B. 자동 채점

> 참조: [FSD.md](FSD.md) §B, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.6, [03-api.md](sds/03-api.md) §3.11

### 8-A. Backend
- [x] `pipeline/blocks/type-b/auto_grade.ts` — 정답 대조:
  - [x] 복수정답 처리
  - [x] 전원정답 처리
  - [x] 배점제외 처리
- [x] B유형 집계 블록: sum_by_subject, subject_fail_check, subject_sum, subject_weighted_sum
- [x] 정답지 API (§3.11):
  - [x] POST /evaluations/:id/answer-key/save
  - [x] POST /evaluations/:id/question-error (출제 오류)
- [ ] B유형 채점 감사 로그 자동 기록
- [ ] B유형 엑셀 양식 생성 (시험유형별 별도 시트) + 업로드 파싱

### 8-B. Frontend
- [x] `domains/evaluation/components/TypeBConfigForm.tsx`

### 8-C. 검증
- [x] 단위 테스트: auto_grade (복수정답) — 1개
- [x] 단위 테스트: sum_by_subject, subject_fail_check, subject_sum — 4개
- [ ] 단위 테스트: 채점 감사 로그 기록 확인

## Phase 9: C. 문항별 채점

> 참조: [FSD.md](FSD.md) §C, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.7

### 9-A. Backend
- [x] `pipeline/blocks/type-c/` — C유형 블록 7개:
  - [x] sub_question_sum, sub_question_weighted_sum
  - [x] question_weight, question_sum, question_weighted_sum
  - [x] sub_question_fail_check, question_fail_check
  - [x] A블록 재활용: exclude_max/min_per_item, average/sum_per_item (applicableTypes에 'C' 포함)
- [ ] C유형 엑셀 양식 생성 (복수 채점위원 다중행 포맷) + 업로드 파싱

### 9-B. Frontend
- [x] `domains/evaluation/components/TypeCConfigForm.tsx`

### 9-C. 검증
- [x] 단위 테스트: C유형 블록 (sub_question_sum, question_weight, question_sum, question_fail_check) — 4개
- [ ] 통합 테스트: C유형 전체 흐름 — DB 연결 후

## Phase 10: 공통 기능 마감

> 참조: [PRD.md](PRD.md) §7, [03-api.md](sds/03-api.md) §3.4, §3.12

### 10-A. 평가 기능
- [x] 평가 복사 기본 구현 (POST /evaluations/:id/copy — config, pipeline_config 포함)
- [x] 소수점 처리 (기본값 + 블록별 오버라이드) — PipelineExecutor에 구현
- [x] 재계산 경고 배지 (needs_recalculation — 설정 변경 시 자동 true)

### 10-B. 감사 로그 실구현
- [x] AuditLogInterceptor에서 AuditService 호출 연결
- [x] 감사 로그 조회 API (§3.12):
  - [x] GET /evaluations/:id/audit-logs (평가별)
  - [x] GET /admin/tenants/:tenantId/audit-logs (테넌트별, platform_admin, 페이지네이션)
- [x] AuditService + AuditPrismaRepository 구현
- [ ] PII 값 기록 금지 검증 — interceptor 연동 후

### 10-C. 검증
- [ ] 단위 테스트: 평가 복사 — DB 연결 후
- [ ] 통합 테스트: 감사 로그 — DB 연결 후

## Phase 11: 결과 조회 + 엑셀 다운로드

> 참조: [03-api.md](sds/03-api.md) §3.8~3.9, [05-excel.md](sds/05-excel.md)

### 11-A. 계산 실행
- [x] POST /evaluations/:id/calculate — 엔드포인트 (stub, PipelineExecutor 연동 필요)
- [ ] 행별 에러 처리 (successCount / errorCount / errors[]) — 실제 실행 로직
- [x] GET /evaluations/:id/calculate/status (비동기 전환 대비 stub)

### 11-B. 결과 조회
- [x] GET /evaluations/:id/results (stub — 페이지네이션 구조)
- [x] GET /evaluations/:id/results/:examineeNo (stub)
- [x] `domains/score/components/ScoreTable.tsx`
- [x] `domains/score/components/IntermediateDetail.tsx`
- [x] `domains/score/components/DownloadButton.tsx`
- [x] `domains/score/hooks/useScores.ts`
- [x] `domains/score/api/scores.ts`
- [x] `domains/score/models/score.ts`
- [x] ResultListPage.tsx, ResultDetailPage.tsx 연동

### 11-C. 엑셀 다운로드
- [x] GET /evaluations/:id/results/download — 엔드포인트 (stub)
- [ ] ExcelJS 스트리밍 구현
- [ ] includeIntermediate 옵션
- [ ] 다운로드 시 감사 로그 자동 기록

### 11-D. 검증
- [ ] 단위 테스트: 계산 실행 — DB 연결 후
- [ ] 성능 테스트: 1,000행 계산 10초 이내
- [ ] 성능 테스트: 10,000행 엑셀 다운로드 30초 이내
- [ ] 통합 테스트: 전체 흐름 — DB 연결 후

## Phase 12: 최종 검증 + 배포 준비

> 참조: [08-nfr.md](sds/08-nfr.md), [09-security.md](sds/09-security.md)

### 12-A. 보안 점검
- [ ] OWASP Top 10 체크리스트 (§9)
- [ ] 멀티테넌트 격리 테스트 (타 테넌트 데이터 접근 차단)
- [ ] SQL Injection 방지 확인 (Prisma raw query 미사용)
- [ ] XSS 방지 확인 (React 이스케이프 + Helmet CSP)
- [ ] Rate Limiting 동작 확인

### 12-B. 성능 점검
- [ ] 250명 동시 접속 시나리오 부하 테스트
- [ ] 엑셀 업로드 10,000행/10MB 처리 확인
- [ ] DB 커넥션 풀 최적화

### 12-C. 사용성 점검
- [ ] Chrome, Edge (최신 2개 버전) 호환성
- [ ] 반응형: 모바일 결과 조회 (테이블 → 카드 뷰)
- [ ] PRD/FSD 매핑 체크리스트 전수 확인 ([08-nfr.md](sds/08-nfr.md) §9 표)

### 12-D. 운영 준비
- [ ] 배포 환경 결정 (Docker Compose / AWS ECS)
- [ ] PM2 설정 + 헬스체크
- [ ] 개인정보처리방침 웹페이지 (09-security.md §9.8)
- [ ] 데이터 보관 기간 만료 배치 — 구현 또는 Phase 2+ 이관 명시
- [ ] E2E 테스트: 핵심 사용자 흐름 (회원가입 → 로그인 → 평가 생성 → 설정 → 업로드 → 계산 → 결과)

---

## 문서 참조 맵

| Phase | 주요 참조 문서 |
|-------|---------------|
| 0 | [01-monorepo.md](sds/01-monorepo.md) |
| 1 | [01-monorepo.md](sds/01-monorepo.md), [02-db-schema.md](sds/02-db-schema.md), [04-pipeline-engine.md](sds/04-pipeline-engine.md) |
| 2 | [06-backend.md](sds/06-backend.md), [02-db-schema.md](sds/02-db-schema.md), [03-api.md](sds/03-api.md), [09-security.md](sds/09-security.md) |
| 3 | [03-api.md](sds/03-api.md) §3.4~3.5, [06-backend.md](sds/06-backend.md) |
| 4 | [07-frontend.md](sds/07-frontend.md), [design-system.md](design/design-system.md) |
| 5 | [04-pipeline-engine.md](sds/04-pipeline-engine.md), [FSD.md](FSD.md), [06-backend.md](sds/06-backend.md) |
| 6 | [FSD.md](FSD.md) §A, [05-excel.md](sds/05-excel.md) |
| 7 | [FSD.md](FSD.md) §D, [03-api.md](sds/03-api.md) §3.10 |
| 8 | [FSD.md](FSD.md) §B, [03-api.md](sds/03-api.md) §3.11 |
| 9 | [FSD.md](FSD.md) §C |
| 10 | [PRD.md](PRD.md) §7, [03-api.md](sds/03-api.md) §3.4, §3.12 |
| 11 | [03-api.md](sds/03-api.md) §3.8~3.9, [05-excel.md](sds/05-excel.md) |
| 12 | [08-nfr.md](sds/08-nfr.md), [09-security.md](sds/09-security.md) |

## 미결사항 (08-nfr.md 기준, 구현 시점 미정)

| 항목 | 현재 상태 | 결정 시점 |
|------|----------|-----------|
| 이메일 발송 서비스 | Phase 2-D에서 stub 구현 | 인프라 셋업 시 |
| 파일 저장소 | raw_data JSONB만 저장 | MVP 이후 |
| 대규모 계산 비동기화 | Phase 11에서 stub endpoint | 부하 테스트 후 |
| 데이터 보관 만료 배치 | Phase 12에서 결정 | Phase 2+ |
