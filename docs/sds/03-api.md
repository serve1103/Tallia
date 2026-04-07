# 3. API 설계

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
      { "examineeNo": "20260015", "message": "D유형 점수 변환표에 일치하는 항목 없음" }
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

### 3.10 점수 변환표 (D유형)

| Method | Path | 설명 |
|--------|------|------|
| GET | /evaluations/:id/mapping-table | 점수 변환표 조회 (entries 포함) |
| PUT | /evaluations/:id/mapping-table | 점수 변환표 전체 저장 |
| POST | /evaluations/:id/mapping-table/upload | 점수 변환표 엑셀 업로드 |
| GET | /evaluations/:id/mapping-table/download | 점수 변환표 엑셀 다운로드 |

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
