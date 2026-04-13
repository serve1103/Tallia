# 8. 비기능 요구사항 반영

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

> 보안 설계 상세는 [09-security.md](09-security.md) 참조

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

# 9. PRD/FSD 매핑 체크리스트

| PRD/FSD 요구사항 | 기술 설계 반영 위치 |
|------------------|-------------------|
| 멀티테넌트 대학 공간 | §2 tenants 테이블, §9.3 TenantGuard |
| 회원가입 (도메인 이메일 + 초대 코드) | §3.2 /auth/signup, §9.2 인증 |
| A유형 — 위원 평가 | §2.3 config, §4.5 블록 상세, §5.2 양식 |
| A유형 — 위원 수별 조건부 파이프라인 | §2.4 pipeline_config conditions, §4.4 조건부 실행 |
| A유형 — 등급 입력 + 매핑 | §2.3 gradeMapping, §4.5 grade_to_score 블록 |
| A유형 — 대항목/소항목 계층 | §2.3 items.subItems |
| B유형 — 자동 채점 | §4.6 auto_grade 블록 상세 |
| B유형 — 복수정답, 전원정답, 배점제외 | §4.6 auto_grade 동작 설명 |
| B유형 — 시험유형별 정답지 | §2.3 examTypes 배열 |
| B유형 — 채점 검증 감사 로그 | §4.6 auto_grade 감사 로그, §8.3 |
| C유형 — 문항/소문항 계층 | §2.3 questions.subQuestions |
| C유형 — 복수 채점위원 (A블록 재활용) | §4.7 위원 집계 블록 |
| D유형 — 점수 변환표 | §2.2 mapping_tables/entries, §4.8 mapping_lookup |
| D유형 — 매칭 실패 처리 | §4.8 error_flag, §5.3 D유형 검증 |
| D유형 — 점수 변환표 엑셀 업로드 | §3.10 /mapping-table/upload |
| 사용자 정의 단계 (템플릿 + 수식) | §4.10 사용자 정의 단계, 샌드박스 |
| 사용자 정의 단계 보안 (화이트리스트, 샌드박스) | §4.10 수식 샌드박스, §9.6 |
| 계산 과정 설정 — 블록 유효성 검증 | §4.11 validatePipeline |
| 계산 과정 설정 — 위원 총점 방식/항목별 계산 방식 혼용 불가 | §4.11 검증 규칙 3 |
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
| 보안 요구사항 | §9 [09-security.md](09-security.md) |
| 지원 환경 (Chrome, Edge, 반응형) | §7.5 |

### 미결 사항 / 추후 결정

| 항목 | 설명 | 결정 시점 |
|------|------|-----------|
| 이메일 발송 서비스 | 이메일 인증, 비밀번호 재설정에 필요. 선택지: AWS SES / Resend / Nodemailer + SMTP | 인프라 셋업 시 |
| 파일 저장소 | 업로드 원본 엑셀 파일 보관 여부. 현재 raw_data JSONB만 저장 | MVP 이후 |
| 배포 환경 | Docker Compose / AWS ECS / 직접 서버. 인프라 결정 필요 | 인프라 셋업 시 |
| 데이터 보관 만료 배치 | 보관 기간 초과 데이터 자동 삭제 스케줄러 구현 방식 | Phase 2 |
| 대규모 계산 비동기화 | 10,000행 이상 계산 시 Bull Queue 도입 시점 | 부하 테스트 후 |
