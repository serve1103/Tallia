# 1. 모노레포 구조

### 1.1 패키지 레이아웃

```
tallia/
├── package.json              # 워크스페이스 루트
├── tsconfig.base.json        # 공유 TS 설정
├── .eslintrc.cjs             # 공유 ESLint
├── .prettierrc               # 공유 Prettier
├── packages/
│   ├── shared/               # 프론트/백 공유 타입·상수·유틸
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/
│   │       │   ├── evaluation.ts     # EvaluationType, EvalConfig 유니온
│   │       │   ├── pipeline.ts       # BlockDef, DataShape, PipelineConfig
│   │       │   ├── score.ts          # Score, IntermediateResult
│   │       │   ├── user.ts           # User, Role
│   │       │   └── tenant.ts         # Tenant
│   │       ├── constants/
│   │       │   ├── block-types.ts    # 블록 타입 열거
│   │       │   ├── data-shapes.ts    # 데이터 형태 열거
│   │       │   └── roles.ts          # PLATFORM_ADMIN, TENANT_ADMIN
│   │       ├── validators/
│   │       │   └── pipeline.ts       # 블록 호환성 검증 (프론트·백 공유)
│   │       └── index.ts
│   ├── backend/              # NestJS API 서버
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       └── ...           # §1.2 참조
│   └── frontend/             # React SPA
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── src/
│           ├── domains/      # 도메인별 co-location (§7 참조)
│           ├── shared/       # 공용 컴포넌트, 유틸
│           └── routes/       # 페이지
└── docs/
```

### 1.2 백엔드 모듈 구조

3계층 레이어드 아키텍처 + Repository 패턴. 상세는 [06-backend.md](06-backend.md) 참조.

```
packages/backend/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/               # TenantGuard, RolesGuard, JwtAuthGuard
│   ├── decorators/           # @CurrentUser, @CurrentTenant, @Roles
│   ├── interceptors/         # AuditLogInterceptor
│   ├── filters/              # GlobalExceptionFilter
│   └── pipes/                # ZodValidationPipe
├── auth/                     # 회원가입, 로그인, JWT
│   ├── controller/
│   ├── application/
│   ├── service/
│   ├── repository/           # Interface
│   └── repository-impl/      # Prisma 구현
├── tenants/                  # 대학 공간 CRUD
├── users/                    # 사용자 관리
├── evaluations/              # 평가 CRUD + 복사
│   ├── controller/
│   ├── application/
│   ├── service/
│   │   └── config-handlers/  # 유형별 설정 핸들러
│   ├── repository/
│   └── repository-impl/
├── pipeline/                 # 파이프라인 엔진 (§4)
│   ├── blocks/               # 블록 구현
│   │   ├── common/
│   │   ├── type-a/
│   │   ├── type-b/
│   │   ├── type-c/
│   │   ├── type-d/
│   │   └── custom/
│   ├── pipeline-executor.ts
│   ├── pipeline-validator.ts
│   └── block-registry.ts
├── excel/                    # 양식 생성 / 업로드 파싱 / 결과 내보내기
├── scores/                   # 계산 실행, 결과 조회
├── mapping-tables/           # D유형 점수 변환표 CRUD
└── audit/                    # 감사 로그
```

> 각 모듈은 controller/ → application/ → service/ → repository/ → repository-impl/ 레이어 구조를 따른다. pipeline/은 블록 레지스트리 패턴을 사용하므로 예외.

### 1.3 공유 설정

| 도구 | 설정 |
|------|------|
| TypeScript | `tsconfig.base.json` — strict, ES2022, paths alias (`@tallia/shared`) |
| ESLint | `@typescript-eslint/recommended`, import order, no-unused-vars |
| Prettier | 2 spaces, single quotes, trailing comma |
| npm workspaces | `packages/*` — `shared`를 backend/frontend가 의존 |
| ORM | Prisma — 스키마 기반 타입 생성, JSONB 지원, 안전한 파라미터 바인딩 |

### 1.4 스크립트

```jsonc
// 루트 package.json
{
  "scripts": {
    "dev": "concurrently \"npm run dev -w backend\" \"npm run dev -w frontend\"",
    "build": "npm run build -w shared && npm run build -w backend && npm run build -w frontend",
    "lint": "eslint packages/*/src --ext .ts,.tsx",
    "test": "npm run test --workspaces",
    "db:migrate": "npm run migrate -w backend",
    "db:seed": "npm run seed -w backend"
  }
}
```
