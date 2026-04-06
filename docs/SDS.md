# Tallia — SDS (System Design Specification)

> PRD.md, FSD.md 기반 시스템 설계 명세. 7개 영역을 다룬다.

---

## 목차

1. [모노레포 구조](#1-모노레포-구조)
2. [DB 스키마](#2-db-스키마)
3. [API 설계](#3-api-설계)
4. [파이프라인 엔진](#4-파이프라인-엔진)
5. [엑셀 처리](#5-엑셀-처리)
6. [인증 / 멀티테넌트](#6-인증--멀티테넌트)
7. [프론트엔드 아키텍처](#7-프론트엔드-아키텍처)
8. [비기능 요구사항 반영](#8-비기능-요구사항-반영)
9. [PRD/FSD 매핑 체크리스트](#9-prdfsd-매핑-체크리스트)

---

## 1. 모노레포 구조

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
│           └── ...           # §7 참조
└── docs/
```

### 1.2 백엔드 모듈 구조

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
├── tenants/                  # 대학 공간 CRUD
├── users/                    # 사용자 관리
├── evaluations/              # 평가 CRUD + 복사
│   └── configs/              # 유형별 설정 핸들러
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
├── mapping-tables/           # D유형 매핑 테이블 CRUD
└── audit/                    # 감사 로그
```

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

---

## 2. DB 스키마

### 2.1 ER 개요

```
tenants ──< users
tenants ──< evaluations ──< score_uploads ──< scores
                       ──< mapping_tables ──< mapping_table_entries
tenants ──< audit_logs
```

### 2.2 테이블 정의

#### tenants

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| name | VARCHAR(100) | 대학명 |
| allowed_domains | TEXT[] | 허용 이메일 도메인 (`@korea.ac.kr`) |
| invite_code | VARCHAR(20) UNIQUE | 초대 코드 |
| data_retention_years | INT DEFAULT 3 | 데이터 보관 기간 (년) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### users

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | NULL이면 플랫폼 관리자 |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt |
| name | VARCHAR(50) | |
| role | VARCHAR(20) | `platform_admin` / `tenant_admin` |
| email_verified | BOOLEAN DEFAULT FALSE | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### evaluations

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| name | VARCHAR(200) | 평가명 |
| type | VARCHAR(1) | `A` / `B` / `C` / `D` |
| academic_year | VARCHAR(10) | 학년도 (optional) |
| admission_type | VARCHAR(100) | 전형명 (optional) |
| config | JSONB NOT NULL | 유형별 설정 (§2.3) |
| pipeline_config | JSONB NOT NULL | 파이프라인 정의 (§2.4) |
| default_decimal | JSONB | `{ "method": "round", "places": 2 }` |
| converted_max | DECIMAL(10,2) | 환산 만점 (예: 500) |
| status | VARCHAR(20) DEFAULT 'draft' | `draft` / `configured` / `calculated` |
| needs_recalculation | BOOLEAN DEFAULT FALSE | 설정/데이터 변경 후 재계산 필요 플래그 |
| copied_from_id | UUID FK → evaluations | 복사 원본 (optional) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**인덱스:**
- `idx_evaluations_tenant` ON (tenant_id)
- `idx_evaluations_tenant_year` ON (tenant_id, academic_year)

#### score_uploads

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| evaluation_id | UUID FK → evaluations | |
| file_name | VARCHAR(255) | 원본 파일명 |
| file_size | INT | 바이트 |
| row_count | INT | 데이터 행 수 |
| status | VARCHAR(20) | `validated` / `active` / `rolled_back` |
| is_current | BOOLEAN DEFAULT FALSE | 현재 활성 업로드 여부 |
| raw_data | JSONB NOT NULL | 파싱된 원본 데이터 (행 배열) |
| validation_errors | JSONB | 검증 오류 목록 |
| uploaded_by | UUID FK → users | |
| uploaded_at | TIMESTAMPTZ | |

**인덱스:**
- `idx_uploads_evaluation` ON (evaluation_id)
- `idx_uploads_current` ON (evaluation_id) WHERE is_current = TRUE

> **Trade-off: raw_data를 JSONB로 저장**
> - 장점: 단일 테이블로 업로드 이력 관리 단순화, 롤백 시 전체 데이터 즉시 접근
> - 단점: 10,000행 시 ~10MB JSONB, 개별 행 쿼리 비효율
> - 결정: MVP에서는 JSONB 유지 (PostgreSQL TOAST 압축 활용). 성능 문제 시 별도 테이블 분리

#### scores

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| evaluation_id | UUID FK → evaluations | |
| upload_id | UUID FK → score_uploads | |
| examinee_no | VARCHAR(50) | 수험번호 |
| examinee_name | VARCHAR(100) | 성명 |
| raw_score | DECIMAL(10,4) | 원점수 (100점 만점) |
| converted_score | DECIMAL(10,4) | 환산점수 |
| fail_flag | BOOLEAN DEFAULT FALSE | 과락 여부 |
| fail_reasons | JSONB | `[{ "type": "item"|"total", "name": "인성", "value": 35, "threshold": 40 }]` |
| intermediate_results | JSONB | `[{ "blockIndex": 0, "blockType": "...", "label": "...", "output": ... }]` |
| error_flag | BOOLEAN DEFAULT FALSE | 오류 (D유형 매칭 실패 등) |
| error_message | TEXT | |
| calculated_at | TIMESTAMPTZ | |

**인덱스:**
- `idx_scores_evaluation` ON (evaluation_id)
- `idx_scores_examinee` UNIQUE ON (evaluation_id, upload_id, examinee_no)

> **Trade-off: 중간 결과 저장 방식**
> - 선택지 A: scores.intermediate_results JSONB — 점수와 함께 저장, 조회 1회 쿼리
> - 선택지 B: 별도 intermediate_results 테이블 정규화 — 특정 단계만 쿼리 가능
> - 결정: 선택지 A. 중간 결과는 항상 전체를 함께 조회하며, 개별 단계 쿼리 필요 없음. JSONB가 단순하고 충분

#### mapping_tables

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| evaluation_id | UUID FK → evaluations UNIQUE | 1:1 관계 |
| mapping_type | VARCHAR(30) | `certificate` / `language_test` / `transfer_gpa` / `achievement` / `custom` |
| columns_def | JSONB | 컬럼 정의 `[{ "key": "lang_type", "label": "어학유형", "type": "text" }]` |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### mapping_table_entries

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| mapping_table_id | UUID FK → mapping_tables | |
| conditions | JSONB | `{ "lang_type": "TOEIC", "score_min": 900, "score_max": 999 }` |
| score | DECIMAL(10,4) | 매핑 점수 |
| sort_order | INT | 표시 순서 |

**인덱스:**
- `idx_mapping_entries_table` ON (mapping_table_id)

#### audit_logs

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | |
| tenant_id | UUID FK → tenants | |
| user_id | UUID FK → users | |
| action | VARCHAR(50) | `data_view` / `data_modify` / `data_download` / `config_change` / `calculate` / `upload` / `rollback` / `grade_verify` |
| resource_type | VARCHAR(50) | `evaluation` / `score` / `upload` 등 |
| resource_id | UUID | |
| details | JSONB | 변경 내용 상세 |
| ip_address | VARCHAR(45) | |
| created_at | TIMESTAMPTZ | |

**인덱스:**
- `idx_audit_tenant_created` ON (tenant_id, created_at DESC)
- `idx_audit_resource` ON (resource_type, resource_id)

### 2.3 evaluation.config JSONB 구조 (유형별)

#### A유형 — 위원 점수 집계형

```jsonc
{
  "maxCommitteeCount": 5,
  "dataType": "score",  // "score" | "grade"
  "items": [
    {
      "id": "item_1",
      "name": "인성",
      "maxScore": 100,
      "weight": 1.0,
      "failThreshold": null,
      "subItems": [
        {
          "id": "sub_1_1",
          "name": "성실성",
          "maxScore": 50,
          "weight": 1.0,
          "failThreshold": null,
          "gradeMapping": { "A": 50, "B": 40, "C": 30 }  // dataType이 "grade"일 때만
        }
      ]
    }
  ]
}
```

#### B유형 — 자동 채점형

```jsonc
{
  "subjects": [
    {
      "id": "subj_1",
      "name": "영어",
      "questionCount": 50,
      "maxScore": 100,
      "failThreshold": 40,
      "examTypes": [
        {
          "id": "type_A",
          "name": "A형",
          "questionCount": 50,  // 유형별 문항 수 (과목 questionCount와 다를 수 있음)
          "answerKey": [
            { "questionNo": 1, "answers": ["3"], "score": 2 },
            { "questionNo": 2, "answers": ["1", "4"], "score": 2 }  // 복수정답
          ]
        }
      ],
      "questionErrors": []  // { questionNo, handling: "all_correct" | "exclude" }
    }
  ],
  "totalFailThreshold": 60
}
```

#### C유형 — 문항 점수 계산형

```jsonc
{
  "committeeCount": 2,  // 0 또는 null이면 단일 채점
  "questions": [
    {
      "id": "q_1",
      "name": "1번",
      "maxScore": 40,
      "weight": 1.0,
      "failThreshold": null,
      "subQuestions": [
        { "id": "sq_1_1", "name": "1-1", "maxScore": 15, "weight": 1.0, "failThreshold": null }
      ]
    }
  ],
  "totalFailThreshold": 60
}
```

#### D유형 — 매핑 테이블형

```jsonc
{
  "mappingType": "language_test",
  "inputColumns": [
    { "key": "lang_type", "label": "어학유형", "type": "text" },
    { "key": "score", "label": "점수", "type": "number" }
  ],
  "maxScore": 100,
  "totalFailThreshold": null
}
```

### 2.4 pipeline_config JSONB 구조

#### A유형 (위원 수별 조건부 분기)

```jsonc
{
  "conditions": [
    {
      "committeeCount": 5,
      "blocks": [
        { "type": "sum_by_committee", "params": {}, "decimal": null },
        { "type": "exclude_max_committee", "params": {}, "decimal": null },
        { "type": "exclude_min_committee", "params": {}, "decimal": null },
        { "type": "committee_average", "params": {}, "decimal": { "method": "round", "places": 2 } },
        { "type": "total_fail_check", "params": { "threshold": 60 }, "decimal": null },
        { "type": "normalize_to_max", "params": {}, "decimal": null },
        { "type": "apply_converted_max", "params": {}, "decimal": null }
      ]
    },
    {
      "committeeCount": 3,
      "blocks": [ /* ... */ ]
    }
  ]
}
```

#### B/C/D 유형 (조건부 분기 없음)

```jsonc
{
  "blocks": [
    { "type": "auto_grade", "params": {}, "decimal": null },
    { "type": "sum_by_subject", "params": {}, "decimal": null },
    { "type": "subject_fail_check", "params": {}, "decimal": null },
    { "type": "subject_sum", "params": {}, "decimal": null },
    { "type": "total_fail_check", "params": { "threshold": 60 }, "decimal": null },
    { "type": "normalize_to_max", "params": {}, "decimal": null },
    { "type": "apply_converted_max", "params": {}, "decimal": { "method": "floor", "places": 0 } }
  ]
}
```

### 2.5 인덱스 전략 요약

| 테이블 | 인덱스 | 목적 |
|--------|--------|------|
| evaluations | (tenant_id) | 테넌트별 평가 목록 |
| evaluations | (tenant_id, academic_year) | 학년도 필터 |
| scores | (evaluation_id) | 평가별 결과 조회 |
| scores | UNIQUE (evaluation_id, upload_id, examinee_no) | 중복 방지 |
| score_uploads | (evaluation_id) WHERE is_current | 활성 업로드 빠른 조회 |
| audit_logs | (tenant_id, created_at DESC) | 감사 로그 최신순 |
| audit_logs | (resource_type, resource_id) | 리소스별 이력 |
| mapping_table_entries | (mapping_table_id) | 매핑 조회 |

> **JSONB 인덱스**: evaluation.config에 대한 GIN 인덱스는 MVP에서 불필요 — config는 항상 전체 조회하며 내부 필드로 필터링하지 않음. 필요 시 추가.

### 2.6 핵심 설계 결정: JSONB vs 정규화

| 대상 | 선택 | 근거 |
|------|------|------|
| evaluation.config | **JSONB** | 유형(A/B/C/D)마다 구조가 완전히 다름. 정규화 시 4개 이상의 유형별 테이블 필요. config는 항상 전체 조회/저장하므로 JSONB가 단순하고 유연 |
| pipeline_config | **JSONB** | 블록 순서·파라미터·조건부 분기를 자유롭게 표현. 정규화하면 pipeline_steps + 다수 파라미터 테이블로 복잡도 증가 |
| scores | **정규화** | 수험생별 점수는 정렬·필터·집계·페이지네이션이 필요한 쿼리 대상. 정규화 필수 |
| scores.intermediate_results | **JSONB** | 항상 전체 조회, 개별 단계 쿼리 불필요 |
| mapping_table_entries | **정규화** | 조건 매칭 쿼리가 핵심. 인덱스 활용 필요 |
| items/questions | **JSONB** (config 내) | 평가 설정의 일부로서 함께 조회/저장. 독립 쿼리 불필요 |

---

## 3. API 설계

### 3.1 공통 규칙

- Base URL: `/api/v1`
- 인증: `Authorization: Bearer <JWT>` (로그인/회원가입 제외)
- 테넌트 격리: JWT에서 tenant_id 추출, 모든 쿼리에 자동 주입
- 응답 형식: `{ "data": ..., "meta": { "total", "page", "limit" } }`
- 오류: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`
- 페이지네이션: `?page=1&limit=20` (기본 20, 최대 100)

### 3.2 인증

| Method | Path | 설명 |
|--------|------|------|
| POST | /auth/signup | 회원가입 (도메인 이메일 또는 초대 코드) |
| POST | /auth/login | 로그인 → JWT 발급 |
| POST | /auth/refresh | 토큰 갱신 |
| POST | /auth/verify-email | 이메일 인증 확인 |
| POST | /auth/forgot-password | 비밀번호 재설정 요청 |
| POST | /auth/reset-password | 비밀번호 재설정 |

**POST /auth/signup**
```jsonc
// Request
{
  "email": "admin@korea.ac.kr",
  "password": "...",
  "name": "홍길동",
  "inviteCode": "KU2026"  // 도메인 불일치 시 필수
}
// Response 201
{ "data": { "id": "...", "email": "...", "emailVerified": false } }
```

### 3.3 플랫폼 관리 (platform_admin 전용)

| Method | Path | 설명 |
|--------|------|------|
| POST | /admin/tenants | 대학 공간 생성 |
| GET | /admin/tenants | 대학 목록 |
| GET | /admin/tenants/:tenantId | 대학 상세 |
| PATCH | /admin/tenants/:tenantId | 대학 수정 (도메인, 초대 코드 등) |
| DELETE | /admin/tenants/:tenantId | 대학 삭제 |
| GET | /admin/tenants/:tenantId/users | 대학 사용자 목록 |
| DELETE | /admin/tenants/:tenantId/users/:userId | 대학 사용자 제거 |

### 3.4 평가 (tenant_admin)

| Method | Path | 설명 |
|--------|------|------|
| POST | /evaluations | 평가 생성 |
| GET | /evaluations | 평가 목록 (필터: academic_year, admission_type, type) |
| GET | /evaluations/:id | 평가 상세 (config + pipeline_config 포함) |
| PATCH | /evaluations/:id | 평가 수정 |
| DELETE | /evaluations/:id | 평가 삭제 |
| POST | /evaluations/:id/copy | 평가 복사 |

**POST /evaluations/:id/copy — 복사 범위:**
- 복사됨: name(+사본 접미사), type, config, pipeline_config, default_decimal, converted_max, mapping_table + entries (D유형)
- 복사 안됨: score_uploads, scores, audit_logs, status(draft로 초기화)

**POST /evaluations**
```jsonc
// Request
{
  "name": "2026학년도 면접",
  "type": "A",
  "academicYear": "2026",
  "admissionType": "수시",
  "config": { /* 유형별 설정 §2.3 */ },
  "pipelineConfig": { /* 파이프라인 §2.4 */ },
  "defaultDecimal": { "method": "round", "places": 2 },
  "convertedMax": 500
}
```

### 3.5 유형별 설정

| Method | Path | 설명 |
|--------|------|------|
| GET | /evaluations/:id/config | 유형별 설정 조회 |
| PUT | /evaluations/:id/config | 유형별 설정 전체 교체 |
| GET | /evaluations/:id/config/preview | 샘플 데이터로 결과 미리보기 |

### 3.6 파이프라인

| Method | Path | 설명 |
|--------|------|------|
| GET | /evaluations/:id/pipeline | 파이프라인 조회 |
| PUT | /evaluations/:id/pipeline | 파이프라인 저장 |
| POST | /evaluations/:id/pipeline/validate | 파이프라인 유효성 검증 |
| POST | /evaluations/:id/pipeline/preview | 샘플 데이터로 파이프라인 테스트 |

**POST /evaluations/:id/pipeline/validate**
```jsonc
// Response 200
{
  "data": {
    "valid": false,
    "errors": [
      { "blockIndex": 2, "message": "이전 블록 출력(MATRIX)이 이 블록의 입력(ARRAY)과 호환되지 않습니다" },
      { "blockIndex": -1, "message": "파이프라인에 [만점 기준 환산] 블록이 없습니다" }
    ]
  }
}
```

### 3.7 엑셀

| Method | Path | 설명 |
|--------|------|------|
| GET | /evaluations/:id/excel/template | 양식 다운로드 (Content-Type: application/vnd.openxmlformats) |
| POST | /evaluations/:id/excel/upload | 엑셀 업로드 + 검증 (multipart/form-data) |
| GET | /evaluations/:id/excel/uploads | 업로드 이력 |
| POST | /evaluations/:id/excel/rollback/:uploadId | 이전 업로드로 롤백 |

**POST /evaluations/:id/excel/upload**
```jsonc
// Response 200 (검증 성공)
{
  "data": {
    "uploadId": "...",
    "rowCount": 500,
    "validationErrors": [],
    "preview": [ /* 처음 5행 미리보기 */ ]
  }
}
// Response 200 (검증 오류 있음 — 업로드는 저장하되 오류 표시)
{
  "data": {
    "uploadId": "...",
    "rowCount": 500,
    "validationErrors": [
      { "row": 15, "column": "인성_위원3", "message": "숫자가 아닌 값입니다" }
    ]
  }
}
```

### 3.8 계산

| Method | Path | 설명 |
|--------|------|------|
| POST | /evaluations/:id/calculate | 계산 실행 (수동) |
| GET | /evaluations/:id/calculate/status | 계산 상태 (비동기 시) |

**POST /evaluations/:id/calculate**
```jsonc
// Response 200
{
  "data": {
    "totalRows": 500,
    "successCount": 498,
    "errorCount": 2,
    "errors": [
      { "examineeNo": "20260015", "message": "D유형 매핑 테이블에 일치하는 항목 없음" }
    ],
    "calculatedAt": "2026-01-15T10:30:00Z"
  }
}
```

### 3.9 결과 조회

| Method | Path | 설명 |
|--------|------|------|
| GET | /evaluations/:id/results | 결과 목록 (페이지네이션, 정렬) |
| GET | /evaluations/:id/results/:examineeNo | 개별 결과 + 중간 결과 |
| GET | /evaluations/:id/results/download | 결과 엑셀 다운로드 |

**GET /evaluations/:id/results**
```jsonc
// Query: ?page=1&limit=50&sort=converted_score:desc&failOnly=false
// Response 200
{
  "data": [
    {
      "examineeNo": "20260001",
      "examineeName": "홍길동",
      "rawScore": 85.00,
      "convertedScore": 425.00,
      "failFlag": false,
      "failReasons": [],
      "errorFlag": false
    }
  ],
  "meta": { "total": 500, "page": 1, "limit": 50 }
}
```

**GET /evaluations/:id/results/download**
```
Query: ?includeIntermediate=true
Response: Excel file (Content-Disposition: attachment)
```

### 3.10 매핑 테이블 (D유형)

| Method | Path | 설명 |
|--------|------|------|
| GET | /evaluations/:id/mapping-table | 매핑 테이블 조회 (entries 포함) |
| PUT | /evaluations/:id/mapping-table | 매핑 테이블 전체 저장 |
| POST | /evaluations/:id/mapping-table/upload | 매핑 테이블 엑셀 업로드 |
| GET | /evaluations/:id/mapping-table/download | 매핑 테이블 엑셀 다운로드 |

### 3.11 B유형 전용

| Method | Path | 설명 |
|--------|------|------|
| PUT | /evaluations/:id/answer-key | 정답지 저장 (config.subjects[].examTypes[].answerKey) |
| POST | /evaluations/:id/question-error | 출제 오류 처리 |

**POST /evaluations/:id/question-error**
```jsonc
// Request
{
  "subjectId": "subj_1",
  "questionNo": 15,
  "handling": "all_correct"  // "all_correct" | "exclude"
}
```

### 3.12 감사 로그

| Method | Path | 설명 |
|--------|------|------|
| GET | /evaluations/:id/audit-logs | 평가별 감사 로그 |
| GET | /admin/tenants/:tenantId/audit-logs | 테넌트별 감사 로그 (플랫폼 관리자) |

---

## 4. 파이프라인 엔진

### 4.1 데이터 형태 (DataShape)

파이프라인을 흐르는 데이터는 다음 형태 중 하나:

| DataShape | 구조 | 설명 |
|-----------|------|------|
| `MATRIX` | `{ items: string[], data: number[][] }` | [항목 × 위원] 2차원 배열. A유형 기본 |
| `GRADE_MATRIX` | `{ items: string[], data: string[][] }` | [항목 × 위원] 등급 문자열. A유형 등급 입력 |
| `ARRAY` | `{ labels: string[], data: number[] }` | 1차원 라벨 배열 (위원 총점, 항목별 점수 등) |
| `SCALAR` | `{ value: number }` | 단일 점수 |
| `QUESTION_ANSWERS` | `{ answers: { qNo: number, answer: string }[] }` | B유형 답안 |
| `QUESTION_SCORES` | `{ scores: { qNo: number, correct: boolean, score: number }[] }` | B유형 채점 결과 |
| `SUBJECT_SCORES` | `{ subjects: { id: string, name: string, score: number }[] }` | B유형 과목별 점수 |
| `QUESTION_ITEM_SCORES` | `{ items: string[], data: number[] }` | C유형 문항별 점수 |
| `MAPPING_INPUT` | `{ conditions: Record<string, string \| number> }` | D유형 매핑 입력 |

모든 형태는 선택적 `failFlags: { type, name, value, threshold }[]` 를 포함할 수 있다.

### 4.2 블록 인터페이스

```typescript
// packages/shared/src/types/pipeline.ts

interface BlockDefinition {
  type: string;                          // 고유 식별자
  name: string;                          // 한글 표시명
  category: 'preprocess' | 'path1' | 'path2' | 'aggregate' | 'postprocess' | 'grading' | 'mapping';
  applicableTypes: ('A' | 'B' | 'C' | 'D')[];
  inputShape: DataShape;                 // 허용 입력 형태
  outputShape: DataShape;                // 산출 형태
  params: ParamDefinition[];             // 설정 가능 파라미터
}

interface PipelineBlock {
  type: string;                          // BlockDefinition.type 참조
  params: Record<string, unknown>;       // 블록별 파라미터 값
  decimal: DecimalConfig | null;         // 블록별 소수점 설정 (null이면 평가 기본값)
}

interface DecimalConfig {
  method: 'round' | 'floor' | 'ceil';
  places: 0 | 1 | 2 | 3;
}

interface BlockInput {
  data: unknown;                         // DataShape에 따른 데이터
  context: ExecutionContext;              // 평가 설정, 매핑 테이블 등 참조
}

interface BlockOutput {
  data: unknown;
  failFlags?: FailFlag[];
}
```

### 4.3 블록 레지스트리

```typescript
// packages/backend/src/pipeline/block-registry.ts

class BlockRegistry {
  private blocks = new Map<string, BlockHandler>();

  register(type: string, handler: BlockHandler): void;
  get(type: string): BlockHandler;
  getByType(evalType: 'A' | 'B' | 'C' | 'D'): BlockDefinition[];
  getDefinition(type: string): BlockDefinition;
}
```

모든 블록은 애플리케이션 시작 시 레지스트리에 자동 등록된다.

### 4.4 파이프라인 실행기

```typescript
class PipelineExecutor {
  execute(
    pipeline: PipelineBlock[],
    initialData: unknown,
    context: ExecutionContext
  ): PipelineResult {
    const intermediateResults: IntermediateResult[] = [];
    let currentData = initialData;
    let failFlags: FailFlag[] = [];

    for (let i = 0; i < pipeline.length; i++) {
      const block = pipeline[i];
      const handler = this.registry.get(block.type);
      const output = handler.execute({ data: currentData, context }, block.params);

      // 소수점 처리: 블록별 설정 > 평가 기본값
      const decimal = block.decimal ?? context.defaultDecimal;
      currentData = this.applyDecimal(output.data, decimal);

      if (output.failFlags) failFlags.push(...output.failFlags);
      intermediateResults.push({
        blockIndex: i,
        blockType: block.type,
        label: handler.definition.name,
        output: currentData
      });
    }

    return { finalData: currentData, intermediateResults, failFlags };
  }
}
```

**위원 수별 조건부 실행 (A유형):**

```typescript
// A유형 계산 시
function executeTypeA(row: RowData, config: PipelineConfig, context: ExecutionContext) {
  const committeeCount = detectCommitteeCount(row);  // 빈칸이 아닌 셀 수로 감지
  const pipeline = config.conditions.find(c => c.committeeCount === committeeCount);

  if (!pipeline) throw new Error(`위원 ${committeeCount}명에 대한 파이프라인이 설정되지 않았습니다`);

  return executor.execute(pipeline.blocks, row.matrix, context);
}
```

### 4.5 A유형 블록 상세

FSD에 정의됨. 여기서는 type 식별자를 확정한다.

**전처리:**

| type | 이름 | 입력 | 출력 |
|------|------|------|------|
| `grade_to_score` | 등급→점수 변환 | GRADE_MATRIX | MATRIX |

**경로1 — 위원 총점 기준:**

| type | 이름 | 입력 | 출력 |
|------|------|------|------|
| `sum_by_committee` | 위원별 항목 합산 | MATRIX | ARRAY (위원 총점) |
| `weighted_sum_by_committee` | 위원별 항목 가중합산 | MATRIX | ARRAY (위원 총점) |
| `add_virtual_committee` | 가상 위원 추가 | ARRAY | ARRAY (+1) |
| `exclude_max_committee` | 최고 위원 제외 | ARRAY | ARRAY (-1) |
| `exclude_min_committee` | 최저 위원 제외 | ARRAY | ARRAY (-1) |
| `committee_average` | 위원 평균 | ARRAY | SCALAR |
| `committee_sum` | 위원 합산 | ARRAY | SCALAR |

**경로2 — 항목별 기준:**

| type | 이름 | 입력 | 출력 |
|------|------|------|------|
| `add_virtual_per_item` | 항목별 가상 위원 추가 | MATRIX | MATRIX (+1열) |
| `exclude_max_per_item` | 항목별 최고점 제외 | MATRIX | MATRIX (-1열) |
| `exclude_min_per_item` | 항목별 최저점 제외 | MATRIX | MATRIX (-1열) |
| `average_per_item` | 항목별 위원 평균 | MATRIX | ARRAY (항목별 점수) |
| `sum_per_item` | 항목별 위원 합산 | MATRIX | ARRAY (항목별 점수) |
| `apply_weight` | 가중치 적용 | ARRAY | ARRAY |
| `sub_to_parent_sum` | 소항목 합산→대항목 | ARRAY | ARRAY (축소) |
| `sub_to_parent_weighted` | 소항목 가중합산→대항목 | ARRAY | ARRAY (축소) |
| `item_sum` | 항목 합산 | ARRAY | SCALAR |
| `item_average` | 항목 평균 | ARRAY | SCALAR |

### 4.6 B유형 블록 상세

| type | 이름 | 입력 | 출력 | 설명 |
|------|------|------|------|------|
| `auto_grade` | 자동 채점 | QUESTION_ANSWERS | QUESTION_SCORES | 정답지 대조, 문항별 배점 적용. 복수정답·전원정답·배점제외 처리 포함 |
| `sum_by_subject` | 과목별 합산 | QUESTION_SCORES | SUBJECT_SCORES | 과목 내 정답 문항 점수 합산 |
| `subject_fail_check` | 과목별 과락 판정 | SUBJECT_SCORES | SUBJECT_SCORES + failFlags | 과목별 과락 기준 체크 |
| `subject_sum` | 과목 합산 | SUBJECT_SCORES | SCALAR | 과목 점수 합산 |
| `subject_weighted_sum` | 과목 가중합산 | SUBJECT_SCORES | SCALAR | 과목별 가중치 적용 후 합산 |

B유형 파이프라인 예시:
```
[auto_grade] → [sum_by_subject] → [subject_fail_check] → [subject_sum]
→ [total_fail_check] → [normalize_to_max] → [apply_converted_max]
```

**auto_grade 상세 동작:**
1. 수험생 답안과 정답지(examType별) 대조
2. questionErrors 확인:
   - `all_correct`: 해당 문항은 모든 수험생 정답 처리
   - `exclude`: 해당 문항 배점을 제외하고, 나머지 문항 기준으로 만점 재산출
3. 복수정답: answers 배열 중 하나라도 일치하면 정답
4. 결과: 문항별 `{ questionNo, correct, score }` 배열
5. 감사 로그: 채점 결과 검증용 로그 자동 기록

### 4.7 C유형 블록 상세

C유형은 A유형의 위원 집계 블록을 재활용하며, 문항 집계용 블록을 추가한다.

**위원 집계 (채점위원이 있을 때) — A유형 경로2 블록 재활용:**

| type | 이름 | 입력 | 출력 |
|------|------|------|------|
| `exclude_max_per_item` | 문항별 최고점 제외 | MATRIX | MATRIX (-1열) |
| `exclude_min_per_item` | 문항별 최저점 제외 | MATRIX | MATRIX (-1열) |
| `average_per_item` | 문항별 위원 평균 | MATRIX | QUESTION_ITEM_SCORES |
| `sum_per_item` | 문항별 위원 합산 | MATRIX | QUESTION_ITEM_SCORES |

**문항 집계:**

| type | 이름 | 입력 | 출력 | 설명 |
|------|------|------|------|------|
| `sub_question_sum` | 소문항 합산→대문항 | QUESTION_ITEM_SCORES | QUESTION_ITEM_SCORES (축소) | 소문항 합산 |
| `sub_question_weighted_sum` | 소문항 가중합산→대문항 | QUESTION_ITEM_SCORES | QUESTION_ITEM_SCORES (축소) | 소문항 가중합산 |
| `question_weight` | 문항 가중치 적용 | QUESTION_ITEM_SCORES | QUESTION_ITEM_SCORES | 문항별 가중치 반영 |
| `question_sum` | 문항 합산 | QUESTION_ITEM_SCORES | SCALAR | 전체 문항 합산 |
| `question_weighted_sum` | 문항 가중합산 | QUESTION_ITEM_SCORES | SCALAR | 전체 문항 가중합산 |
| `sub_question_fail_check` | 소문항별 과락 판정 | QUESTION_ITEM_SCORES | 동일 + failFlags | |
| `question_fail_check` | 대문항별 과락 판정 | QUESTION_ITEM_SCORES | 동일 + failFlags | |

C유형 파이프라인 예시 (복수 채점위원):
```
[average_per_item] → [sub_question_sum] → [question_fail_check] → [question_sum]
→ [total_fail_check] → [normalize_to_max] → [apply_converted_max]
```

C유형 파이프라인 예시 (단일 채점):
```
[sub_question_sum] → [question_weight] → [question_sum]
→ [total_fail_check] → [normalize_to_max] → [apply_converted_max]
```

### 4.8 D유형 블록 상세

| type | 이름 | 입력 | 출력 | 설명 |
|------|------|------|------|------|
| `mapping_lookup` | 매핑 테이블 조회 | MAPPING_INPUT | SCALAR | 조건 값으로 매핑 테이블에서 점수 조회. 매칭 실패 시 error_flag 설정 |

D유형 파이프라인 예시:
```
[mapping_lookup] → [total_fail_check] → [normalize_to_max] → [apply_converted_max]
```

**mapping_lookup 상세 동작:**
1. 매핑 유형별 매칭 로직:
   - `certificate`: (자격유형, 급수) 정확 매칭
   - `language_test`: (어학유형) 정확 매칭 + 점수 구간(score_min ≤ x ≤ score_max)
   - `transfer_gpa`: 평점/백분위 구간 매칭
   - `achievement`: (실적유형, 등급) 정확 매칭
   - `custom`: 범용 조건 매칭
2. 매칭 실패: 해당 수험생에 `error_flag = true`, `error_message` 설정

### 4.9 공통 후처리 블록

| type | 이름 | 입력 | 출력 | 설명 |
|------|------|------|------|------|
| `item_fail_check` | 항목별 과락 판정 | ARRAY / MATRIX | 동일 + failFlags | 항목별 과락 기준 체크 |
| `total_fail_check` | 전체 과락 판정 | SCALAR | SCALAR + failFlags | 전체 점수 기준 과락 체크 |
| `normalize_to_max` | 만점 기준 환산 | SCALAR | SCALAR | `score / maxScore × 100` → 원점수 |
| `apply_converted_max` | 환산 만점 적용 | SCALAR | SCALAR | `rawScore × (convertedMax / 100)` → 환산점수 |

### 4.10 커스텀 블록

두 가지 방식:

**1) 템플릿 블록:**

| type | 이름 | 파라미터 | 동작 |
|------|------|----------|------|
| `custom_bonus` | 가산점 부여 | condition, bonusScore | 조건 충족 시 가산 |
| `custom_ratio` | 비율 조정 | ratio | `score × ratio` |
| `custom_range_map` | 구간 변환 | ranges[] | 점수 구간별 값 매핑 |
| `custom_clamp` | 상한/하한 제한 | min, max | `clamp(score, min, max)` |

입력/출력: SCALAR → SCALAR (단일 점수에 대한 후처리)

**2) 직접 수식 (고급):**

| type | 파라미터 |
|------|----------|
| `custom_formula` | `{ expression: "score * 0.6 + bonus" }` |

**보안 — 수식 샌드박스:**
- 라이브러리: `mathjs` (restricted scope)
- 허용 변수: `score`, `maxScore`, `count`, `bonus`, `weight`, `min`, `max`, `avg`, `sum`
- 허용 함수: `abs`, `round`, `floor`, `ceil`, `pow`, `sqrt`, `min`, `max`
- 금지: 함수 정의, 프로퍼티 접근, 외부 참조
- 검증 절차:
  1. `mathjs.parse(expression)`으로 AST 생성
  2. AST 노드를 순회하며 허용되지 않은 식별자/함수 검출 → 거부
  3. 실행 타임아웃: 100ms
- 저장 전 테스트 값으로 결과 검증 필수 (API: `POST /evaluations/:id/pipeline/preview`)

### 4.11 블록 유효성 검증

```typescript
// packages/shared/src/validators/pipeline.ts
// 프론트엔드(실시간)와 백엔드(저장 시) 모두에서 사용

function validatePipeline(
  blocks: PipelineBlock[],
  evalType: 'A' | 'B' | 'C' | 'D',
  config: EvalConfig
): ValidationResult {
  const errors: ValidationError[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const def = registry.getDefinition(blocks[i].type);

    // 1. 블록이 해당 유형에서 사용 가능한지
    if (!def.applicableTypes.includes(evalType)) {
      errors.push({ blockIndex: i, message: `${def.name}은(는) ${evalType}유형에서 사용할 수 없습니다` });
    }

    // 2. 입출력 형태 호환성
    if (i > 0) {
      const prevDef = registry.getDefinition(blocks[i - 1].type);
      if (!isCompatible(prevDef.outputShape, def.inputShape)) {
        errors.push({ blockIndex: i, message: `이전 블록 출력(${prevDef.outputShape})과 호환되지 않습니다` });
      }
    }
  }

  // 3. 경로1/경로2 혼용 검사 (A유형)
  // 4. 필수 블록 누락 검사 (normalize_to_max)
  // 5. 등급 데이터인데 grade_to_score 누락 검사
  // 6. 최종 출력이 SCALAR인지 검사

  return { valid: errors.length === 0, errors };
}
```

### 4.12 소수점 처리

```typescript
function applyDecimal(value: number, config: DecimalConfig): number {
  const factor = Math.pow(10, config.places);
  switch (config.method) {
    case 'round': return Math.round(value * factor) / factor;
    case 'floor': return Math.floor(value * factor) / factor;
    case 'ceil':  return Math.ceil(value * factor) / factor;
  }
}
```

적용 시점: **각 블록 실행 직후** (파이프라인 실행기에서)
- 블록별 `decimal`이 설정되어 있으면 해당 설정 사용
- 없으면 평가의 `defaultDecimal` 사용
- 이는 중간 결과에도 반영되어 단계별 정확한 값 확인 가능

---

## 5. 엑셀 처리

### 5.1 라이브러리

| 용도 | 라이브러리 | 선택 근거 |
|------|-----------|-----------|
| 서버 엑셀 생성/파싱 | **ExcelJS** | 스트리밍 지원, 스타일링, 대용량 처리 |
| 파일 업로드 | **multer** (NestJS built-in) | multipart/form-data 처리 |

### 5.2 양식 자동 생성

evaluation.config의 항목 구조를 기반으로 동적 컬럼 생성:

**A유형 양식:**
```
수험번호 | 성명 | {항목1}_{소항목1}_위원1 | {항목1}_{소항목1}_위원2 | ... | {항목1}_{소항목1}_위원N | {항목1}_{소항목2}_위원1 | ...
```
- 컬럼 수 = `Σ(소항목 수 × 최대위원수)` + 고정 2열 (수험번호, 성명)
- 소항목 없는 대항목은 대항목명만 사용
- 셀 스타일: 헤더 배경색, 항목별 그룹 구분, 데이터 영역 테두리

**B유형 양식:**
- 시험유형 동일 문항수: `수험번호 | 성명 | 시험유형 | 1번 | 2번 | ... | N번` (단일 시트)
- 시험유형별 문항수 다름: 유형별 별도 시트 (시트명: 유형명, 각 시트의 문항 열 수는 해당 유형의 questionCount에 따름)

**C유형 양식:**
- 단일 채점: `수험번호 | 성명 | {대문항}-{소문항} | ...`
- 복수 채점위원: `수험번호 | 성명 | 위원 | {대문항}-{소문항} | ...`

**D유형 양식:**
- config.inputColumns 기반: `수험번호 | 성명 | {column1} | {column2} | ...`

**공통:**
- 1행: 헤더
- 데이터 유효성 검사 (숫자 범위, 드롭다운 등) 엑셀 내장 기능 활용
- 양식 보호 (헤더 행 잠금)
- 시트명: 평가명

### 5.3 업로드 파싱 + 검증

```
업로드 → 파일 크기 검증 (≤10MB) → ExcelJS 파싱 → 헤더 검증 → 행별 데이터 검증 → 저장
```

**검증 항목:**

| 검증 | 설명 |
|------|------|
| 헤더 일치 | 양식과 동일한 컬럼 구조인지 확인 |
| 필수 값 | 수험번호, 성명 비어있지 않은지 |
| 데이터 타입 | 점수 컬럼에 숫자, 등급 컬럼에 유효한 등급 |
| 범위 | 점수가 0 ~ 만점 이내 |
| 수험번호 중복 | 동일 수험번호 중복 행 (C유형 복수 채점위원 제외) |
| 행 수 제한 | ≤ 10,000행 |
| D유형 매칭 | 매핑 테이블에 없는 값 경고 (업로드는 허용, 계산 시 오류) |

검증 오류가 있어도 업로드 데이터는 저장 (status: `validated`). 사용자가 확인 후 수정 가능.

### 5.4 결과 다운로드

```
결과 조회 → ExcelJS 워크북 생성 → 스트리밍 응답
```

**기본 시트:**
```
수험번호 | 성명 | 원점수 | 환산점수 | 과락여부 | 과락사유
```

**중간 결과 포함 시 (includeIntermediate=true):**
```
수험번호 | 성명 | [단계1_이름] | [단계2_이름] | ... | 원점수 | 환산점수 | 과락여부 | 과락사유
```

**대용량 처리:**
- ExcelJS 스트리밍 모드 사용 (`workbook.xlsx.write(stream)`)
- 10,000행 기준 30초 이내 (PRD 목표)

---

## 6. 인증 / 멀티테넌트

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

---

## 7. 프론트엔드 아키텍처

### 7.1 기술 스택

| 영역 | 기술 | 근거 |
|------|------|------|
| 빌드 | Vite | 빠른 HMR, ESM 네이티브 |
| 라우팅 | React Router v7 | 표준 SPA 라우팅 |
| 서버 상태 | TanStack Query v5 | 캐싱, 자동 재검증, 낙관적 업데이트 |
| 클라이언트 상태 | Zustand | 파이프라인 빌더 등 복잡한 로컬 상태 관리 |
| UI 컴포넌트 | Ant Design v5 | 관리자 도구에 적합한 풍부한 컴포넌트 |
| HTTP | axios | 인터셉터 기반 인증 토큰 관리 |
| 폼 | React Hook Form + Zod | 유효성 검증 공유 (shared 패키지) |

### 7.2 디렉토리 구조

```
packages/frontend/src/
├── main.tsx
├── App.tsx
├── routes/
│   ├── index.tsx                 # 라우트 정의
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   ├── admin/
│   │   ├── TenantListPage.tsx
│   │   └── TenantDetailPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx     # 평가 목록
│   ├── evaluation/
│   │   ├── CreatePage.tsx
│   │   ├── ConfigPage.tsx        # 유형별 설정
│   │   ├── PipelinePage.tsx      # 파이프라인 빌더
│   │   └── UploadPage.tsx        # 엑셀 업로드
│   └── results/
│       ├── ResultListPage.tsx
│       └── ResultDetailPage.tsx
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx         # Ant Design Layout + Sider
│   │   └── AuthLayout.tsx
│   ├── evaluation/
│   │   ├── TypeAConfigForm.tsx
│   │   ├── TypeBConfigForm.tsx
│   │   ├── TypeCConfigForm.tsx
│   │   └── TypeDConfigForm.tsx
│   ├── pipeline-builder/
│   │   ├── PipelineBuilder.tsx   # 메인 빌더 컴포넌트
│   │   ├── BlockPalette.tsx      # 블록 팔레트 (유형별 필터)
│   │   ├── BlockCard.tsx         # 개별 블록 카드
│   │   ├── BlockParamEditor.tsx  # 블록 파라미터 편집
│   │   ├── ConditionalTabs.tsx   # A유형 위원 수별 탭
│   │   ├── ValidationBadge.tsx   # 실시간 유효성 표시
│   │   └── PreviewPanel.tsx      # 샘플 데이터 미리보기
│   ├── excel/
│   │   ├── UploadDropzone.tsx
│   │   ├── ValidationPreview.tsx
│   │   └── UploadHistory.tsx
│   └── results/
│       ├── ScoreTable.tsx
│       ├── IntermediateDetail.tsx
│       └── DownloadButton.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useEvaluations.ts
│   ├── usePipeline.ts
│   └── useScores.ts
├── stores/
│   ├── authStore.ts              # 토큰, 사용자 정보
│   └── pipelineStore.ts          # 파이프라인 빌더 편집 상태
├── api/
│   ├── client.ts                 # axios 인스턴스 + 인터셉터
│   ├── auth.ts
│   ├── evaluations.ts
│   ├── pipeline.ts
│   ├── excel.ts
│   └── scores.ts
└── types/                        # @tallia/shared re-export + 프론트 전용 타입
```

### 7.3 파이프라인 빌더 UI

핵심 UX:

```
┌─────────────────────────────────────────────┐
│  [위원 5명] [위원 4명] [위원 3명]  ← A유형 탭  │
├─────────────────────────────────────────────┤
│  블록 팔레트          │  파이프라인 편집기       │
│  ┌───────────────┐   │  ┌─────────────────┐  │
│  │ 위원별 항목 합산 │   │  │ 1. 위원별 항목 합산│  │
│  │ 최고 위원 제외  │   │  │    [✓] 호환       │  │
│  │ 최저 위원 제외  │   │  ├─────────────────┤  │
│  │ 위원 평균      │   │  │ 2. 최고 위원 제외  │  │
│  │ ...           │   │  │    [✓] 호환       │  │
│  └───────────────┘   │  ├─────────────────┤  │
│                      │  │ 3. 위원 평균      │  │
│                      │  │    [✓] 호환       │  │
│                      │  ├─────────────────┤  │
│                      │  │ + 블록 추가       │  │
│                      │  └─────────────────┘  │
├─────────────────────────────────────────────┤
│  ⚠ 경고: [만점 기준 환산] 블록이 없습니다       │
├─────────────────────────────────────────────┤
│  [미리보기] 샘플 데이터로 테스트              │
└─────────────────────────────────────────────┘
```

**구현 상세:**
- 드래그앤드롭: `@dnd-kit/core` (경량, 접근성 지원)
- 블록 팔레트: 평가 유형에 따라 사용 가능한 블록만 표시, 경로1/경로2 혼용 불가 필터
- 실시간 유효성: `@tallia/shared`의 `validatePipeline()` 호출, 입출력 호환성 뱃지 표시
- 조건부 탭 (A유형): 위원 수별 탭 전환, 각 탭에 독립 파이프라인
- 블록 파라미터: BlockCard 클릭 시 Drawer로 파라미터 편집 (threshold, method 등)
- 소수점 설정: 각 블록 카드에 선택적 소수점 오버라이드 설정
- 미리보기: 샘플 데이터 입력 → API 호출 → 단계별 중간 결과 시각화

### 7.4 상태 관리 전략

| 상태 | 도구 | 이유 |
|------|------|------|
| 인증 (토큰, 유저) | Zustand + persist | 새로고침 후에도 유지 |
| 서버 데이터 (평가 목록, 결과 등) | TanStack Query | 캐싱, 자동 재검증, 페이지네이션 |
| 파이프라인 빌더 편집 상태 | Zustand | 복잡한 중첩 상태, 실시간 유효성 검증, 빈번한 업데이트 |
| 폼 상태 (설정 편집) | React Hook Form | 유효성 검증, dirty 상태, 제출 관리 |

### 7.5 반응형

- Ant Design의 Grid 시스템 활용
- 브레이크포인트: xs(< 576px), sm, md, lg(≥ 992px), xl
- 모바일: 결과 조회 중심 (테이블을 카드 뷰로 전환)
- 파이프라인 빌더: 데스크톱 전용 (최소 lg 이상)

---

## 8. 비기능 요구사항 반영

### 8.1 성능

| 요구사항 | 반영 |
|----------|------|
| 250명 동시 접속 | NestJS 단일 인스턴스로 충분. 필요 시 PM2 클러스터 모드 |
| 엑셀 업로드 10,000행/10MB | multer 파일 크기 제한, ExcelJS 스트리밍 파싱 |
| 계산 1,000명 10초 이내 | 동기 실행. 파이프라인은 인메모리 순차 처리로 충분한 성능 |
| 엑셀 다운로드 10,000행 30초 이내 | ExcelJS 스트리밍 모드 |

> **Trade-off: 동기 vs 비동기 계산**
> - MVP: 동기 계산 (1,000행 수준에서 10초 이내 가능). 구현 단순
> - 확장: 대규모 데이터 시 Bull Queue + 진행률 폴링 전환 가능. 현재는 과잉 설계

### 8.2 보안

| 요구사항 | 반영 |
|----------|------|
| bcrypt 해싱 | auth 모듈, salt rounds 12 |
| JWT 인증 | JwtAuthGuard, 1시간 만료 + 리프레시 |
| 멀티테넌트 격리 | TenantGuard, 모든 쿼리에 tenant_id 조건 |
| 커스텀 블록 샌드박스 | mathjs 제한 실행, AST 화이트리스트 검증, 100ms 타임아웃 |
| HTTPS | 배포 환경에서 리버스 프록시(nginx) TLS 종료 |
| XSS 방지 | React 기본 이스케이프 + Helmet 미들웨어 |
| SQL Injection | Prisma 파라미터 바인딩 (raw query 사용 금지) |

### 8.3 개인정보 보호

| 요구사항 | 반영 |
|----------|------|
| 감사 로그 | AuditLogInterceptor — 모든 데이터 조회/수정/다운로드 자동 기록 |
| 다운로드 이력 | audit_logs action=`data_download` |
| 데이터 보관 기간 | tenants.data_retention_years, 배치 작업으로 만료 데이터 삭제 |
| 완전 삭제 | 삭제 시 soft delete 아닌 hard delete + 관련 scores, uploads 포함 CASCADE |
| B유형 채점 검증 | auto_grade 블록 실행 시 감사 로그 자동 기록 |

### 8.4 가용성

| 요구사항 | 반영 |
|----------|------|
| 99.5% SLA | PM2 프로세스 매니저 자동 재시작, 헬스체크 엔드포인트 |
| 입학 시즌 안정성 | DB 커넥션 풀 설정, 부하 테스트 후 튜닝 |

---

## 9. PRD/FSD 매핑 체크리스트

| PRD/FSD 요구사항 | 기술 설계 반영 위치 |
|------------------|-------------------|
| 멀티테넌트 대학 공간 | §2 tenants 테이블, §6 TenantGuard |
| 회원가입 (도메인 이메일 + 초대 코드) | §3.2 /auth/signup, §6.1 인증 흐름 |
| A유형 — 위원 점수 집계형 | §2.3 config, §4.5 블록 상세, §5.2 양식 |
| A유형 — 위원 수별 조건부 파이프라인 | §2.4 pipeline_config conditions, §4.4 조건부 실행 |
| A유형 — 등급 입력 + 매핑 | §2.3 gradeMapping, §4.5 grade_to_score 블록 |
| A유형 — 대항목/소항목 계층 | §2.3 items.subItems |
| B유형 — 자동 채점 | §4.6 auto_grade 블록 상세 |
| B유형 — 복수정답, 전원정답, 배점제외 | §4.6 auto_grade 동작 설명 |
| B유형 — 시험유형별 정답지 | §2.3 examTypes 배열 |
| B유형 — 채점 검증 감사 로그 | §4.6 auto_grade 감사 로그, §8.3 |
| C유형 — 문항/소문항 계층 | §2.3 questions.subQuestions |
| C유형 — 복수 채점위원 (A블록 재활용) | §4.7 위원 집계 블록 |
| D유형 — 매핑 테이블 | §2.2 mapping_tables/entries, §4.8 mapping_lookup |
| D유형 — 매칭 실패 처리 | §4.8 error_flag, §5.3 D유형 검증 |
| D유형 — 매핑 테이블 엑셀 업로드 | §3.10 /mapping-table/upload |
| 커스텀 블록 (템플릿 + 수식) | §4.10 커스텀 블록, 샌드박스 |
| 커스텀 블록 보안 (화이트리스트, 샌드박스) | §4.10 수식 샌드박스, §8.2 |
| 파이프라인 빌더 — 블록 유효성 검증 | §4.11 validatePipeline |
| 파이프라인 빌더 — 경로1/2 혼용 불가 | §4.11 검증 규칙 3 |
| 엑셀 양식 자동 생성 | §5.2 유형별 양식 구조 |
| 엑셀 업로드 검증 | §5.3 검증 항목 |
| 재업로드 / 롤백 | §2.2 score_uploads.is_current, §3.7 rollback API |
| 계산 — 수동 실행 | §3.8 POST /calculate |
| 재계산 경고 배지 | §2.2 evaluations.needs_recalculation |
| 원점수 + 환산점수 | §4.9 normalize_to_max + apply_converted_max |
| 중간 결과 조회 | §2.2 scores.intermediate_results, §3.9 results API |
| 결과 엑셀 다운로드 (중간 결과 옵션) | §5.4 includeIntermediate |
| 평가 복사 | §3.4 POST /evaluations/:id/copy |
| 샘플 미리보기 | §3.5 /config/preview, §3.6 /pipeline/preview |
| 소수점 처리 (기본 + 블록별) | §4.12, §2.2 default_decimal + 블록별 decimal |
| 감사 로그 | §2.2 audit_logs, §8.3 |
| 개인정보 보관 기간 | §2.2 tenants.data_retention_years, §8.3 |
| 성능 목표 | §8.1 |
| 보안 요구사항 | §8.2 |
| 지원 환경 (Chrome, Edge, 반응형) | §7.5 |

### 미결 사항 / 추후 결정

| 항목 | 설명 | 결정 시점 |
|------|------|-----------|
| 이메일 발송 서비스 | 이메일 인증, 비밀번호 재설정에 필요. 선택지: AWS SES / Resend / Nodemailer + SMTP | 인프라 셋업 시 |
| 파일 저장소 | 업로드 원본 엑셀 파일 보관 여부. 현재 raw_data JSONB만 저장 | MVP 이후 |
| 배포 환경 | Docker Compose / AWS ECS / 직접 서버. 인프라 결정 필요 | 인프라 셋업 시 |
| 데이터 보관 만료 배치 | 보관 기간 초과 데이터 자동 삭제 스케줄러 구현 방식 | Phase 2 |
| 대규모 계산 비동기화 | 10,000행 이상 계산 시 Bull Queue 도입 시점 | 부하 테스트 후 |
