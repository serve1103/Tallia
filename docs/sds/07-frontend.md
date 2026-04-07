# 7. 프론트엔드 아키텍처

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
