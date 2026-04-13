# Tallia — Implementation Task Plan

> PRD §10 구현 우선순위 + SDS 문서 기반 구현 계획.
> 각 Phase는 독립 배포 가능 단위. 체크박스로 진행 상황 추적.

## Phase 0: 모노레포 초기화

> 참조: [01-monorepo.md](sds/01-monorepo.md) §1.1, §1.3, §1.4

- [ ] 루트 `package.json` (npm workspaces: `packages/*`, devDependencies: concurrently)
- [ ] `tsconfig.base.json` (strict, ES2022, paths: `@tallia/shared`)
- [ ] `.eslintrc.cjs` (@typescript-eslint, import/order, import/no-restricted-paths)
- [ ] `.prettierrc` (2 spaces, single quotes, trailing comma)
- [ ] `.gitignore` (node_modules, dist, .env, prisma/migrations)
- [ ] `.env.example` (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_ORIGIN, TRUST_PROXY, PORT)
- [ ] 루트 scripts (dev, build, lint, test, db:migrate, db:seed)
- [ ] `npm install` 루트에서 실행 확인

## Phase 1: Shared 패키지

> 참조: [01-monorepo.md](sds/01-monorepo.md) §1.1, [02-db-schema.md](sds/02-db-schema.md) §2.3~2.4, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.1~4.2

- [ ] `packages/shared/package.json` + `tsconfig.json` (의존성: zod)
- [ ] `src/types/user.ts` — User, Role (`platform_admin | tenant_admin`)
- [ ] `src/types/tenant.ts` — Tenant
- [ ] `src/types/evaluation.ts` — EvaluationType, EvalConfig 유니온 (A/B/C/D)
- [ ] `src/types/pipeline.ts` — BlockDef, DataShape, PipelineConfig (A: conditions[], B/C/D: blocks[])
- [ ] `src/types/score.ts` — Score, IntermediateResult
- [ ] `src/constants/roles.ts` — PLATFORM_ADMIN, TENANT_ADMIN
- [ ] `src/constants/block-types.ts` — 블록 타입 열거
- [ ] `src/constants/data-shapes.ts` — 9개 DataShape 열거
- [ ] `src/validators/pipeline.ts` — validatePipeline() 기본 구현
- [ ] `src/index.ts` — 배럴 export
- [ ] `npm run build -w shared` 타입 에러 없이 통과

## Phase 2: Backend 기반

> 참조: [06-backend.md](sds/06-backend.md), [02-db-schema.md](sds/02-db-schema.md), [09-security.md](sds/09-security.md)

### 2-A. 패키지 초기화
- [ ] `packages/backend/package.json` + `tsconfig.json`
- [ ] NestJS 의존성 설치 (core, common, jwt, passport, throttler, prisma, bcrypt, helmet, cookie-parser, zod)
- [ ] `@tallia/shared` 의존성 연결

### 2-B. Prisma 스키마
> 참조: [02-db-schema.md](sds/02-db-schema.md) §2.2, §2.5

- [ ] `prisma/schema.prisma` — provider: postgresql
- [ ] 모델 정의 (8개):
  - [ ] Tenant (allowed_domains: String[], invite_code, data_retention_years)
  - [ ] User (tenant_id nullable, role, password_hash)
  - [ ] Evaluation (config: Json, pipeline_config: Json, default_decimal: Json, needs_recalculation)
  - [ ] ScoreUpload (raw_data: Json, is_current)
  - [ ] Score (intermediate_results: Json, fail_flag, error_flag)
  - [ ] MappingTable + MappingTableEntry
  - [ ] AuditLog (append-only)
- [ ] 인덱스 정의 (§2.5)
- [ ] `prisma validate` 통과
- [ ] `prisma generate` 실행
- [ ] 초기 마이그레이션 (`prisma migrate dev --name init`)

### 2-C. 공통 인프라 (common/)
> 참조: [06-backend.md](sds/06-backend.md) §6.4~6.5, [09-security.md](sds/09-security.md)

- [ ] `guards/jwt-auth.guard.ts` — AuthGuard('jwt') 래핑
- [ ] `guards/tenant.guard.ts` — §9.3 TenantGuard (platform_admin 통과)
- [ ] `guards/roles.guard.ts` — §9.3 RolesGuard (Reflector + @Roles)
- [ ] `decorators/current-user.decorator.ts` — @CurrentUser()
- [ ] `decorators/current-tenant.decorator.ts` — @CurrentTenant()
- [ ] `decorators/roles.decorator.ts` — @Roles()
- [ ] `decorators/public.decorator.ts` — @Public() (JwtAuthGuard 바이패스)
- [ ] `interceptors/audit-log.interceptor.ts` — before/after 구조 (실제 기록은 Phase 10)
- [ ] `filters/global-exception.filter.ts` — §9.5 (PII/스택트레이스 노출 차단)
- [ ] `pipes/zod-validation.pipe.ts` — Zod 스키마 기반 검증

### 2-D. Auth 모듈
> 참조: [03-api.md](sds/03-api.md) §3.2, [09-security.md](sds/09-security.md) §9.2

- [ ] `auth/controller/auth.controller.ts` — 6개 엔드포인트:
  - [ ] POST /auth/signup (도메인 이메일 → 테넌트 자동 배정 또는 invite_code)
  - [ ] POST /auth/login (JWT 발급: AT 1h + RT 7d httpOnly 쿠키)
  - [ ] POST /auth/refresh (RT Rotation: 기존 RT 폐기 → 새 AT/RT)
  - [ ] POST /auth/verify-email (이메일 인증 확인)
  - [ ] POST /auth/forgot-password (비밀번호 재설정 요청)
  - [ ] POST /auth/reset-password (비밀번호 재설정)
- [ ] `auth/application/auth.application.ts`
- [ ] `auth/service/auth.service.ts` — bcrypt(12), JWT Payload: { sub, tenantId, role }
- [ ] `auth/repository/auth.repository.ts` — Interface
- [ ] `auth/repository-impl/auth.prisma.repository.ts`
- [ ] Rate Limiting: login 5/min, signup 3/min (IP 기준)
- [ ] 이메일 발송 서비스 — stub 구현 (실제 발송은 인프라 확정 후, §8 미결사항)

### 2-E. Tenants 모듈
> 참조: [03-api.md](sds/03-api.md) §3.3

- [ ] `tenants/controller/` — 7개 엔드포인트 (platform_admin 전용):
  - [ ] POST /admin/tenants (생성)
  - [ ] GET /admin/tenants (목록)
  - [ ] GET /admin/tenants/:tenantId (상세)
  - [ ] POST /admin/tenants/:tenantId/update (수정)
  - [ ] POST /admin/tenants/:tenantId/delete (삭제)
  - [ ] GET /admin/tenants/:tenantId/users (사용자 목록)
  - [ ] POST /admin/tenants/:tenantId/users/:userId/remove (사용자 제거)
- [ ] `tenants/application/` + `service/` + `repository/` + `repository-impl/`
- [ ] `@Roles('platform_admin')` 적용

### 2-F. Users 모듈
- [ ] `users/controller/` — GET /users/me, POST /users/me/update
- [ ] `users/application/` + `service/` + `repository/` + `repository-impl/`

### 2-G. App Module + main.ts
> 참조: [06-backend.md](sds/06-backend.md) §6.4, §6.6

- [ ] `app.module.ts` — AuthModule, TenantsModule, UsersModule import
- [ ] `main.ts` 부트스트랩:
  - [ ] Helmet (보안 헤더)
  - [ ] CORS (origin: env.FRONTEND_ORIGIN, methods: GET/POST, credentials: true)
  - [ ] Body limit 10mb
  - [ ] cookie-parser
  - [ ] trust proxy
  - [ ] 전역 Guard 순서: ThrottlerGuard → JwtAuthGuard → TenantGuard → RolesGuard
  - [ ] 전역 Pipe: ZodValidationPipe
  - [ ] 전역 Filter: GlobalExceptionFilter
- [ ] 헬스체크 엔드포인트 (GET /health)

### 2-H. DB 시딩
- [ ] `prisma/seed.ts` — 초기 platform_admin 계정 생성
- [ ] 테스트용 테넌트 + tenant_admin 계정

### 2-I. 검증
- [ ] `npm run build -w backend` 통과
- [ ] `npm run lint` 에러 없음
- [ ] 단위 테스트: auth.service (signup, login, refresh)
- [ ] 단위 테스트: tenant.guard, roles.guard

## Phase 3: Evaluations 모듈

> 참조: [03-api.md](sds/03-api.md) §3.4~3.5, [06-backend.md](sds/06-backend.md) §6.3

### 3-A. Backend — Evaluations CRUD
- [ ] `evaluations/controller/evaluations.controller.ts` — 6개 엔드포인트:
  - [ ] POST /evaluations (생성 — type, config, pipeline_config 포함)
  - [ ] GET /evaluations (목록 — 필터: academic_year, admission_type, type)
  - [ ] GET /evaluations/:id (상세 — config + pipeline_config 포함)
  - [ ] POST /evaluations/:id/update (수정)
  - [ ] POST /evaluations/:id/delete (삭제)
  - [ ] POST /evaluations/:id/copy (복사 — Phase 10에서 상세 구현)
- [ ] `evaluations/application/evaluations.application.ts`
- [ ] `evaluations/service/evaluations.service.ts`
- [ ] `evaluations/service/config-handlers/` — 유형별 설정 핸들러:
  - [ ] type-a.handler.ts
  - [ ] type-b.handler.ts
  - [ ] type-c.handler.ts
  - [ ] type-d.handler.ts
- [ ] `evaluations/repository/evaluations.repository.ts` — Interface
- [ ] `evaluations/repository-impl/evaluations.prisma.repository.ts`

### 3-B. Backend — Config 엔드포인트
> 참조: [03-api.md](sds/03-api.md) §3.5

- [ ] GET /evaluations/:id/config (유형별 설정 조회)
- [ ] POST /evaluations/:id/config/save (유형별 설정 저장)
- [ ] GET /evaluations/:id/config/preview (샘플 미리보기 — 엔진 연동은 Phase 5)

### 3-C. app.module.ts 업데이트
- [ ] EvaluationsModule import 추가

### 3-D. 검증
- [ ] 단위 테스트: evaluations.service (CRUD)
- [ ] 통합 테스트: evaluations API (생성 → 조회 → 수정 → 삭제)

## Phase 4: Frontend 기반

> 참조: [07-frontend.md](sds/07-frontend.md), [design-system.md](design/design-system.md)

### 4-A. 패키지 초기화
- [ ] `packages/frontend/package.json` + `tsconfig.json`
- [ ] Vite 설정 (React plugin, proxy /api → localhost:3000, @tallia/shared alias)
- [ ] 의존성: react, react-dom, react-router-dom, antd, @ant-design/icons, axios, @tanstack/react-query, zustand, react-hook-form, @hookform/resolvers, zod, @tallia/shared

### 4-B. 디자인 시스템 적용
> 참조: [design-system.md](design/design-system.md) §7

- [ ] `src/shared/theme/token.ts` — Ant Design ThemeConfig (§7 코드 그대로)
- [ ] `src/shared/theme/index.ts` — theme export
- [ ] `src/App.tsx` — ConfigProvider 래핑
- [ ] Pretendard + Inter 폰트 로드 (index.html 또는 CSS import)

### 4-C. 공용 유틸
- [ ] `src/shared/lib/api-client.ts` — axios 인스턴스:
  - [ ] baseURL: `/api/v1`, withCredentials: true
  - [ ] 요청 인터셉터: Bearer 토큰 자동 주입
  - [ ] 응답 인터셉터: 401 수신 → POST /auth/refresh → 원래 요청 재시도 (1회)
- [ ] `src/shared/lib/format.ts` — 숫자/날짜 포맷 유틸
- [ ] `src/shared/lib/decimal.ts` — 소수점 처리 유틸 (@tallia/shared 래퍼)

### 4-D. 공용 레이아웃
> 참조: [design-system.md](design/design-system.md) §5.6~5.7

- [ ] `src/shared/components/AppLayout.tsx` — Sider 260px (bg #f8f8fa) + Topbar 64px + breadcrumb
- [ ] `src/shared/components/AuthLayout.tsx` — 중앙 카드 레이아웃

### 4-E. Auth 도메인
> 참조: [07-frontend.md](sds/07-frontend.md) §7.2, §7.4

- [ ] `src/domains/auth/stores/authStore.ts` — Zustand + persist ({ user, accessToken, setAuth, clearAuth })
- [ ] `src/domains/auth/api/auth.ts` — login, signup, logout, refresh API 함수
- [ ] `src/domains/auth/hooks/useAuth.ts`
- [ ] `src/domains/auth/components/LoginForm.tsx` — RHF + Zod + Ant Design Form
- [ ] `src/domains/auth/components/SignupForm.tsx` — 이메일, 비밀번호, 이름, invite_code

### 4-F. Admin 도메인
- [ ] `src/domains/admin/api/tenants.ts`
- [ ] `src/domains/admin/hooks/useTenants.ts`
- [ ] `src/domains/admin/components/TenantList.tsx`
- [ ] `src/domains/admin/components/TenantDetail.tsx`

### 4-G. Evaluation 도메인 (기본)
- [ ] `src/domains/evaluation/api/evaluations.ts`
- [ ] `src/domains/evaluation/hooks/useEvaluations.ts`
- [ ] `src/domains/evaluation/models/evaluation.ts` — 도메인 모델 변환, 뷰 모델

### 4-H. 라우팅 + 페이지
- [ ] `src/routes/index.tsx` — React Router v7 라우트 정의
- [ ] PrivateRoute (인증 여부 체크, 미인증 → /login 리다이렉트)
- [ ] Auth 페이지:
  - [ ] `src/routes/auth/LoginPage.tsx`
  - [ ] `src/routes/auth/SignupPage.tsx`
- [ ] 메인 페이지:
  - [ ] `src/routes/dashboard/DashboardPage.tsx` — 평가 목록 + 학년도/전형명 필터
  - [ ] `src/routes/evaluation/CreatePage.tsx` — 유형 선택 (A/B/C/D) + 기본 정보
  - [ ] `src/routes/evaluation/ConfigPage.tsx` — 유형별 설정 (config-handler 연동)
  - [ ] `src/routes/evaluation/PipelinePage.tsx` — 계산 과정 설정 (Phase 5에서 구현)
  - [ ] `src/routes/evaluation/UploadPage.tsx` — 엑셀 업로드 (Phase 6에서 구현)
- [ ] 결과 페이지 (껍데기):
  - [ ] `src/routes/results/ResultListPage.tsx`
  - [ ] `src/routes/results/ResultDetailPage.tsx`
- [ ] Admin 페이지:
  - [ ] `src/routes/admin/TenantListPage.tsx`
  - [ ] `src/routes/admin/TenantDetailPage.tsx`
- [ ] 에러 페이지: 404 NotFoundPage
- [ ] ESLint `import/no-restricted-paths` 설정: routes/ → domains/ → shared/ 단방향

### 4-I. 검증
- [ ] `npm run build -w frontend` 통과
- [ ] 로그인 페이지 렌더링 확인
- [ ] 대시보드 페이지 평가 목록 표시 확인
- [ ] 라우트 보호 (미인증 → 로그인 리다이렉트) 확인

## Phase 5: Pipeline 엔진 + 사용자 정의 단계

> 참조: [04-pipeline-engine.md](sds/04-pipeline-engine.md), [FSD.md](FSD.md)

### 5-A. Backend — 핵심 엔진
- [ ] `pipeline/block-registry.ts` — 블록 등록/조회
- [ ] `pipeline/pipeline-executor.ts` — 순차 실행, 블록별 소수점 처리
- [ ] `pipeline/pipeline-validator.ts` — validatePipeline() 백엔드 버전

### 5-B. Backend — 공통 블록 (후처리 4종)
> 참조: [FSD.md](FSD.md) 후처리 단계

- [ ] `pipeline/blocks/common/item-fail-check.ts` — 항목별 과락 판정
- [ ] `pipeline/blocks/common/total-fail-check.ts` — 전체 과락 판정
- [ ] `pipeline/blocks/common/normalize-to-max.ts` — 만점 기준 환산 (→ 원점수)
- [ ] `pipeline/blocks/common/apply-converted-max.ts` — 환산 만점 적용 (→ 환산점수)

### 5-C. Backend — 사용자 정의 블록 (5종)
> 참조: [FSD.md](FSD.md) 사용자 정의 단계, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.10

- [ ] `pipeline/blocks/custom/bonus-points.ts` — 가산점 부여
- [ ] `pipeline/blocks/custom/ratio-adjust.ts` — 비율 조정
- [ ] `pipeline/blocks/custom/range-convert.ts` — 구간 변환
- [ ] `pipeline/blocks/custom/clamp.ts` — 상한/하한 제한
- [ ] `pipeline/blocks/custom/custom-formula.ts` — mathjs 샌드박스 (AST 화이트리스트, 100ms 타임아웃)

### 5-D. Backend — Pipeline API
> 참조: [03-api.md](sds/03-api.md) §3.6

- [ ] GET /evaluations/:id/pipeline (조회)
- [ ] POST /evaluations/:id/pipeline/save (저장)
- [ ] POST /evaluations/:id/pipeline/validate (유효성 검증)
- [ ] POST /evaluations/:id/pipeline/preview (샘플 테스트)
- [ ] app.module.ts에 PipelineModule import

### 5-E. Backend — Excel 모듈 골격
> 참조: [06-backend.md](sds/06-backend.md) §6.3, [05-excel.md](sds/05-excel.md)

- [ ] `excel/controller/excel.controller.ts`
- [ ] `excel/application/excel.application.ts`
- [ ] `excel/service/template-generator.ts` — 양식 생성 (유형별 분기 구조)
- [ ] `excel/service/upload-parser.ts` — 업로드 파싱 (유형별 분기 구조)
- [ ] `excel/service/result-exporter.ts` — 결과 내보내기 (구조만)
- [ ] `excel/repository/` + `repository-impl/`
- [ ] app.module.ts에 ExcelModule import

### 5-F. Backend — Scores 모듈 골격
- [ ] `scores/controller/scores.controller.ts`
- [ ] `scores/application/` + `service/` + `repository/` + `repository-impl/`
- [ ] app.module.ts에 ScoresModule import

### 5-G. Backend — Audit 모듈 골격
- [ ] `audit/service/audit.service.ts`
- [ ] `audit/repository/audit.repository.ts` — Interface
- [ ] `audit/repository-impl/audit.prisma.repository.ts`
- [ ] app.module.ts에 AuditModule import

### 5-H. Frontend — Pipeline 도메인
- [ ] `domains/pipeline/components/PipelineBuilder.tsx` — 메인 빌더
- [ ] `domains/pipeline/components/BlockPalette.tsx` — 유형별 필터
- [ ] `domains/pipeline/components/BlockCard.tsx` — 개별 블록 카드
- [ ] `domains/pipeline/components/BlockParamEditor.tsx` — Drawer 파라미터 편집
- [ ] `domains/pipeline/components/ConditionalTabs.tsx` — A유형 위원 수별 탭
- [ ] `domains/pipeline/components/ValidationBadge.tsx` — 실시간 유효성 표시
- [ ] `domains/pipeline/components/PreviewPanel.tsx` — 샘플 미리보기
- [ ] `domains/pipeline/stores/pipelineStore.ts` — 편집 상태
- [ ] `domains/pipeline/hooks/usePipeline.ts`
- [ ] `domains/pipeline/api/pipeline.ts`
- [ ] `domains/pipeline/models/pipeline.ts` — 블록 헬퍼, 유효성 해석
- [ ] @dnd-kit/core 드래그앤드롭 통합
- [ ] PipelinePage.tsx 연동

### 5-I. 검증
- [ ] 단위 테스트: pipeline-executor (블록 순차 실행, 소수점 처리)
- [ ] 단위 테스트: pipeline-validator (호환성 검증)
- [ ] 단위 테스트: custom-formula (샌드박스 보안 — 금지된 함수 차단 확인)
- [ ] 통합 테스트: pipeline API (저장 → 검증 → 미리보기)

## Phase 6: A. 위원 평가

> 참조: [FSD.md](FSD.md) §A, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.5, [05-excel.md](sds/05-excel.md)

### 6-A. Backend — A유형 블록
- [ ] `pipeline/blocks/type-a/` — 블록 구현:
  - [ ] 위원별 항목 합산 (sum_by_committee)
  - [ ] 위원별 총점 합산 (sum_committee_total)
  - [ ] 최고 위원 제외 (drop_highest_committee)
  - [ ] 최저 위원 제외 (drop_lowest_committee)
  - [ ] 위원 평균 (committee_average)
  - [ ] 위원 가중 평균 (committee_weighted_average)
  - [ ] 등급→점수 변환 (grade_to_score)
  - [ ] 항목별 위원 평균 (item_committee_average)
  - [ ] 항목별 최고 제외 (item_drop_highest)
  - [ ] 항목별 최저 제외 (item_drop_lowest)
  - [ ] 항목별 가중합 (item_weighted_sum)
  - [ ] 항목 합산 (sum_items)
- [ ] A유형 조건부 실행 (위원 수별 파이프라인 분기)
- [ ] Evaluation config 핸들러 (A유형) 상세 구현

### 6-B. Backend — A유형 엑셀
> 참조: [05-excel.md](sds/05-excel.md) §5.2

- [ ] A유형 양식 자동생성 (항목×위원 동적 열, 등급/점수 분기)
- [ ] A유형 업로드 파싱 + 검증
- [ ] Excel API 연동 (§3.7):
  - [ ] GET /evaluations/:id/excel/template (양식 다운로드)
  - [ ] POST /evaluations/:id/excel/upload (업로드 + 검증)
  - [ ] GET /evaluations/:id/excel/uploads (업로드 이력)
  - [ ] POST /evaluations/:id/excel/rollback/:uploadId (롤백)

### 6-C. Frontend
- [ ] `domains/evaluation/components/TypeAConfigForm.tsx` — 항목, 위원 수, 등급 매핑 설정
- [ ] `domains/excel/components/UploadDropzone.tsx` — 범용 업로드 UI
- [ ] `domains/excel/components/ValidationPreview.tsx` — 검증 결과 미리보기
- [ ] `domains/excel/components/UploadHistory.tsx` — 이력 + 롤백
- [ ] `domains/excel/hooks/useExcel.ts`
- [ ] `domains/excel/api/excel.ts`
- [ ] UploadPage.tsx 연동

### 6-D. 검증
- [ ] 단위 테스트: A유형 블록 (각 블록 입출력)
- [ ] 단위 테스트: A유형 조건부 실행 (위원 수 분기)
- [ ] 통합 테스트: A유형 전체 흐름 (설정 → 업로드 → 파이프라인 실행)

## Phase 7: D. 점수 변환표

> 참조: [FSD.md](FSD.md) §D, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.8, [03-api.md](sds/03-api.md) §3.10

### 7-A. Backend
- [ ] `pipeline/blocks/type-d/mapping_lookup.ts` — 5가지 매칭 전략
- [ ] 매칭 실패 error_flag 처리
- [ ] MappingTable API (§3.10):
  - [ ] GET /evaluations/:id/mapping-table (조회)
  - [ ] POST /evaluations/:id/mapping-table/save (저장)
  - [ ] POST /evaluations/:id/mapping-table/upload (엑셀 업로드)
  - [ ] GET /evaluations/:id/mapping-table/download (엑셀 다운로드)
- [ ] D유형 엑셀 양식 생성 + 업로드 파싱
- [ ] MappingTablesModule → app.module.ts

### 7-B. Frontend
- [ ] `domains/evaluation/components/TypeDConfigForm.tsx`
- [ ] 매핑 테이블 화면 직접 편집 UI

### 7-C. 검증
- [ ] 단위 테스트: mapping_lookup (5가지 매칭 전략, 실패 케이스)

## Phase 8: B. 자동 채점

> 참조: [FSD.md](FSD.md) §B, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.6, [03-api.md](sds/03-api.md) §3.11

### 8-A. Backend
- [ ] `pipeline/blocks/type-b/auto_grade.ts` — 정답 대조:
  - [ ] 복수정답 처리
  - [ ] 전원정답 처리
  - [ ] 배점제외 처리
- [ ] 정답지 API (§3.11):
  - [ ] POST /evaluations/:id/answer-key/save
  - [ ] POST /evaluations/:id/question-error (출제 오류)
- [ ] B유형 채점 감사 로그 자동 기록
- [ ] B유형 엑셀 양식 생성 (시험유형별 별도 시트) + 업로드 파싱

### 8-B. Frontend
- [ ] `domains/evaluation/components/TypeBConfigForm.tsx`

### 8-C. 검증
- [ ] 단위 테스트: auto_grade (복수정답, 전원정답, 배점제외)
- [ ] 단위 테스트: 채점 감사 로그 기록 확인

## Phase 9: C. 문항별 채점

> 참조: [FSD.md](FSD.md) §C, [04-pipeline-engine.md](sds/04-pipeline-engine.md) §4.7

### 9-A. Backend
- [ ] `pipeline/blocks/type-c/` — C유형 블록 (A블록 재활용 포함):
  - [ ] 문항별 위원 점수 집계
  - [ ] 문항별 위원 평균
  - [ ] 문항 점수 합산
  - [ ] 소문항 합산
  - [ ] (A블록 재활용: 최고/최저 제외, 위원 평균 등)
- [ ] 문항/소문항 계층 처리
- [ ] C유형 엑셀 양식 생성 (복수 채점위원 다중행 포맷) + 업로드 파싱

### 9-B. Frontend
- [ ] `domains/evaluation/components/TypeCConfigForm.tsx`

### 9-C. 검증
- [ ] 단위 테스트: C유형 블록
- [ ] 통합 테스트: C유형 전체 흐름

## Phase 10: 공통 기능 마감

> 참조: [PRD.md](PRD.md) §7, [03-api.md](sds/03-api.md) §3.4, §3.12

### 10-A. 평가 기능
- [ ] 평가 복사 상세 구현 (POST /evaluations/:id/copy — config, pipeline_config, mapping_table 포함)
- [ ] 소수점 처리 (기본값 + 블록별 오버라이드)
- [ ] 재계산 경고 배지 (needs_recalculation 플래그)

### 10-B. 감사 로그 실구현
- [ ] AuditLogInterceptor에서 AuditService 호출 연결
- [ ] 감사 로그 조회 API (§3.12):
  - [ ] GET /evaluations/:id/audit-logs (평가별)
  - [ ] GET /admin/tenants/:tenantId/audit-logs (테넌트별, platform_admin)
- [ ] PII 값 기록 금지 (필드명만), Append-Only 정책

### 10-C. 검증
- [ ] 단위 테스트: 평가 복사 (복사 범위 확인)
- [ ] 통합 테스트: 감사 로그 (데이터 접근/수정/다운로드 기록 확인)

## Phase 11: 결과 조회 + 엑셀 다운로드

> 참조: [03-api.md](sds/03-api.md) §3.8~3.9, [05-excel.md](sds/05-excel.md)

### 11-A. 계산 실행
- [ ] POST /evaluations/:id/calculate — 동기 실행
- [ ] 행별 에러 처리 (successCount / errorCount / errors[])
- [ ] GET /evaluations/:id/calculate/status (비동기 전환 대비 stub)

### 11-B. 결과 조회
- [ ] GET /evaluations/:id/results (페이지네이션, 정렬, failOnly 필터)
- [ ] GET /evaluations/:id/results/:examineeNo (중간 결과 포함)
- [ ] `domains/score/components/ScoreTable.tsx`
- [ ] `domains/score/components/IntermediateDetail.tsx` — 중간 결과 펼침
- [ ] `domains/score/components/DownloadButton.tsx`
- [ ] `domains/score/hooks/useScores.ts`
- [ ] `domains/score/api/scores.ts`
- [ ] `domains/score/models/score.ts` — 점수 포맷, 과락 판정 헬퍼
- [ ] ResultListPage.tsx, ResultDetailPage.tsx 연동

### 11-C. 엑셀 다운로드
- [ ] GET /evaluations/:id/results/download — ExcelJS 스트리밍 모드
- [ ] includeIntermediate 옵션
- [ ] 다운로드 시 감사 로그 자동 기록 (action: data_download)

### 11-D. 검증
- [ ] 단위 테스트: 계산 실행 (정상/에러 케이스)
- [ ] 성능 테스트: 1,000행 계산 10초 이내
- [ ] 성능 테스트: 10,000행 엑셀 다운로드 30초 이내
- [ ] 통합 테스트: 전체 흐름 (업로드 → 계산 → 결과 조회 → 다운로드)

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
