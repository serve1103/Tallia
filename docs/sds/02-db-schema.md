# 2. DB 스키마

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

#### A유형 — 위원 평가

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

#### B유형 — 자동 채점

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

#### C유형 — 문항별 채점

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

#### D유형 — 점수 변환표

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
