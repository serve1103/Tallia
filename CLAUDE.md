# Tallia

대학 입학처 평가점수 환산 멀티테넌트 웹앱. 현재 문서만 존재, 코드 미구현.

## 구현 진행

`docs/task.md` Phase 0~12 순서대로. 선행 Phase 완료 전 다음 Phase 착수 금지.

## 문서 맵

- 요구사항: `docs/PRD.md` → `docs/FSD.md`
- 설계 인덱스: `docs/SDS.md` (9개 하위문서 → `docs/sds/`)
- 디자인 토큰: `docs/design/design-system.md`
- 목업: `docs/design/mockups/`

## 아키텍처

**백엔드** (상세: `docs/sds/06-backend.md`)
```
Controller → Application → Service → Repository(Interface) → RepositoryImpl(Prisma)
```
- Service는 Repository 인터페이스만 의존. PrismaClient 직접 import 금지, raw query 금지.
- Guard 순서: Throttler → JwtAuth → Tenant → Roles
- 멀티테넌트: 모든 쿼리에 tenant_id 조건 필수 (@CurrentTenant)

**프론트엔드** (상세: `docs/sds/07-frontend.md`)
```
routes/ → domains/ → shared/    (단방향만 허용, 역방향·cross-domain 금지)
```
- TanStack Query 훅: API 호출 + 캐시만. 변환 로직은 `models/`에서.

## 핵심 규칙

**API** (상세: `docs/sds/03-api.md`)
- GET과 POST만 사용. 수정: `POST /:id/update`, 삭제: `POST /:id/delete`
- Base: `/api/v1`
- 응답: `{ data, meta: { total, page, limit } }`, 에러: `{ error: { code, message, details } }`

**보안** (상세: `docs/sds/09-security.md`)
- bcrypt salt 12. JWT: `{ sub, tenantId, role }`. AT 1h, RT 7d httpOnly.
- 에러에 PII·스택트레이스·DB쿼리 노출 금지. 감사 로그 PII 값 기록 금지.
- 수식 샌드박스: mathjs AST 화이트리스트 + 100ms 타임아웃.

**디자인** (상세: `docs/design/design-system.md`)
- Primary `#18181b` 모노크롬. 색상은 시맨틱(상태 배지)에만. 폰트 Inter + Pretendard.
- Ant Design v5 테마 토큰: design-system.md §7 코드 그대로 사용. 임의 변경 금지.

## 네이밍

**BE**: `{module}.controller.ts`, `{module}.service.ts`, `{module}.repository.ts`, `{module}.prisma.repository.ts`
**FE**: 컴포넌트 `PascalCase.tsx`, 훅 `use*.ts`, 스토어 `*Store.ts`, API `{domain}.ts`
**커밋**: `<type>(<scope>): <한글>` — type: feat/fix/docs/refactor/test/chore, scope: backend/frontend/shared 등

## 평가 유형

A: 위원 평가 | B: 자동 채점 | C: 문항별 채점 | D: 점수 변환표
