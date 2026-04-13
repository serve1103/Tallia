# Tallia — SDS (System Design Specification)

> PRD.md, FSD.md 기반 시스템 설계 명세. 7개 영역 + 비기능 요구사항.

## 문서 구조

| # | 문서 | 내용 |
|---|------|------|
| 1 | [모노레포 구조](sds/01-monorepo.md) | npm workspaces, packages 구성, 백엔드 모듈, 공유 설정, Prisma ORM |
| 2 | [DB 스키마](sds/02-db-schema.md) | 7개 테이블, JSONB 구조, 인덱스 전략, JSONB vs 정규화 결정 |
| 3 | [API 설계](sds/03-api.md) | RESTful /api/v1, 12개 그룹 ~40개 엔드포인트, 요청/응답 예시 |
| 4 | [파이프라인 엔진](sds/04-pipeline-engine.md) | DataShape, 블록 인터페이스/레지스트리/실행기, A/B/C/D 블록 상세, 커스텀 블록, 유효성 검증, 소수점 처리 |
| 5 | [엑셀 처리](sds/05-excel.md) | ExcelJS, 양식 자동생성, 업로드 파싱/검증, 결과 다운로드 |
| 6 | [프론트엔드 아키텍처](sds/07-frontend.md) | Vite, React Router, TanStack Query, Zustand, Ant Design, 계산 과정 설정 UI |
| 7 | [비기능 요구사항 + 매핑 체크리스트](sds/08-nfr.md) | 성능, 개인정보, 가용성, PRD/FSD 매핑, 미결 사항 |
| 8 | [보안 설계](sds/09-security.md) | 서버 보안, 인증/인가, Rate Limiting, 에러 처리, 감사 로그 보안, 개인정보 보호 |
