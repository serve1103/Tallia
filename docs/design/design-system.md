# Tallia Design System

> premium-saas.html 기반 디자인 토큰 및 컴포넌트 명세.
> 프로젝트 셋업 시 Ant Design v5 ConfigProvider에 주입할 테마 정의.

## 1. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **모노크롬 우선** | Primary는 Zinc Black(`#18181b`). 색상은 시맨틱(상태 표시)에만 사용 |
| **구조로 전달** | 색이 아닌 타이포그래피 계층, 여백, 보더로 정보 구조 전달 |
| **절제된 장식** | 그림자는 `shadow-sm`만, 라운드는 `6~8px`, 애니메이션 최소화 |
| **숫자 가독성** | 점수 데이터는 `font-variant-numeric: tabular-nums` + Inter 폰트 |

## 2. Color Token

### 2.1 Background

| Token | Value | 용도 |
|-------|-------|------|
| `colorBgBody` | `#ffffff` | 페이지 배경 |
| `colorBgSidebar` | `#f8f8fa` | 사이드바 배경 |
| `colorBgSurface` | `#ffffff` | 카드, 테이블 배경 |
| `colorBgHover` | `#f1f1f4` | 호버 상태 |
| `colorBgCardHover` | `#fafafa` | 테이블 행 호버 |

### 2.2 Border

| Token | Value | 용도 |
|-------|-------|------|
| `colorBorderLight` | `#f4f4f5` | 테이블 행 구분, 약한 구분선 |
| `colorBorderBase` | `#e4e4e7` | 카드 보더, 사이드바 구분선 |
| `colorBorderDark` | `#d4d4d8` | 버튼 호버 보더 |

### 2.3 Text

| Token | Value | 용도 |
|-------|-------|------|
| `colorTextMain` | `#09090b` | 제목, 본문, 숫자 |
| `colorTextMuted` | `#71717a` | 보조 텍스트, 라벨 |
| `colorTextFaint` | `#a1a1aa` | 힌트, 비활성, 화살표 |

### 2.4 Primary (모노크롬)

| Token | Value | 용도 |
|-------|-------|------|
| `colorPrimary` | `#18181b` | 버튼, 로고 아이콘 |
| `colorPrimaryHover` | `#27272a` | 버튼 호버 |

### 2.5 Semantic (상태 전용)

| 상태 | Background | Text | Border | Dot |
|------|-----------|------|--------|-----|
| **Success** | `#f0fdf4` | `#15803d` | `#bbf7d0` | `#22c55e` |
| **Info/Active** | `#eff6ff` | `#1d4ed8` | `#bfdbfe` | `#3b82f6` |
| **Warning** | `#fffbeb` | `#92400e` | `#fde68a` | `#f59e0b` |
| **Error** | `#fef2f2` | `#b91c1c` | `#fecaca` | `#ef4444` |
| **Neutral** | `#f1f1f4` | `#71717a` | `#e4e4e7` | `#a1a1aa` |

### 2.6 Trend

| 상태 | Color | 용도 |
|------|-------|------|
| `trendUp` | `#16a34a` | 증가 (+3) |
| `trendDown` | `#ef4444` | 감소 (-1) |
| `trendNeutral` | `#a1a1aa` | 변동 없음 |

## 3. Typography

### 3.1 Font Family

```
--font-ui: 'Inter', 'Pretendard', sans-serif;
```

- 영문/숫자: Inter (tabular-nums 지원)
- 한글: Pretendard (Inter와 x-height 유사)
- fallback: system sans-serif

### 3.2 Font Scale

| 용도 | Size | Weight | Letter Spacing | 예시 |
|------|------|--------|----------------|------|
| 페이지 제목 | 26px | 600 | -0.03em | "평가 지원 현황" |
| 섹션 제목 | 16px | 600 | -0.02em | "최근 업데이트된 평가 모음" |
| 본문 | 14px | 400 | 0 | 설명 텍스트 |
| 네비 항목 | 13px | 500 (active: 600) | 0 | "평가 세션 관리" |
| 테이블 헤더 | 12px | 600 | -0.01em | "평가 세션명" |
| 테이블 셀 | 13px | 400 (name: 500) | 0 | 데이터 값 |
| 배지 | 12px | 600 | -0.01em | "환산 완료" |
| 라벨 (uppercase) | 11px | 600 | 0.05em | "MAIN", "SETTINGS" |
| 통계 숫자 | 32px | 600 | -0.02em | "24건" |
| 통계 단위 | 16px | 500 | 0 | "건" |
| 버튼 | 13px | 600 | -0.01em | "신규 평가 생성" |
| breadcrumb | 13px | 500 (current: 600) | 0 | "서울대학교 입학처" |

### 3.3 숫자 표시 규칙

- `font-variant-numeric: tabular-nums` — 테이블 내 숫자 정렬
- `font-family: 'Inter', sans-serif` — 숫자 전용
- 점수: 소수점 2자리 고정 (85.00, 425.00)
- 대시(`—`): 값 없음 표시

## 4. Spacing & Layout

### 4.1 Border Radius

| Token | Value | 용도 |
|-------|-------|------|
| `borderRadiusSm` | `4px` | 로고 아이콘, 작은 요소 |
| `borderRadiusMd` | `6px` | 버튼, 네비 항목, 파이프라인 블록 |
| `borderRadiusLg` | `8px` | 카드, 테이블 컨테이너 |
| `borderRadiusXl` | `12px` | 특수 컨테이너 |
| `borderRadiusFull` | `999px` | 배지, 아바타 |

### 4.2 Shadow

| Token | Value | 용도 |
|-------|-------|------|
| `boxShadowSm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | 카드, 버튼, 파이프라인 블록 |
| `boxShadowMd` | `0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)` | 드롭다운, 모달 |

### 4.3 간격 체계

| 용도 | Value |
|------|-------|
| 사이드바 너비 | 260px |
| 사이드바 패딩 | 24px 16px |
| 탑바 높이 | 64px |
| 탑바 패딩 | 0 40px |
| 콘텐츠 패딩 | 40px |
| 콘텐츠 최대 너비 | 1200px |
| 페이지 헤더 → 콘텐츠 | 32px |
| 통계 카드 간격 | 16px |
| 카드 내부 패딩 | 20px 24px |
| 테이블 셀 패딩 | 16px 24px |
| 테이블 헤더 패딩 | 14px 24px |
| 네비 항목 패딩 | 8px 12px |
| 네비 그룹 간격 | 24px |
| 로고 → 네비 간격 | 36px |

## 5. Component Spec

### 5.1 Button

| Variant | Background | Text | Border | Shadow |
|---------|-----------|------|--------|--------|
| `primary` | `#18181b` | `#fff` | none | shadow-sm |
| `primary:hover` | `#27272a` | `#fff` | none | shadow-sm |
| `outline` | `#fff` | `#09090b` | 1px `#e4e4e7` | shadow-sm |
| `outline:hover` | `#f1f1f4` | `#09090b` | 1px `#d4d4d8` | shadow-sm |

- 높이: 36px (소형: 32px)
- 패딩: 0 16px
- 라운드: 6px
- 폰트: 13px / 600
- 아이콘 + 텍스트 gap: 6px

### 5.2 Badge (상태 배지)

| Variant | Background | Text | Border | Dot |
|---------|-----------|------|--------|-----|
| `green` | `#f0fdf4` | `#15803d` | `#bbf7d0` | `#22c55e` |
| `blue` | `#eff6ff` | `#1d4ed8` | `#bfdbfe` | `#3b82f6` |
| `red` | `#fef2f2` | `#b91c1c` | `#fecaca` | `#ef4444` |
| `gray` | `#f1f1f4` | `#71717a` | `#e4e4e7` | `#a1a1aa` |

- 패딩: 2px 8px
- 라운드: 999px (pill)
- 폰트: 12px / 600
- Dot: 6px 원, `::before` pseudo-element
- gap (dot ↔ text): 6px

### 5.3 Stat Card (통계 카드)

```
┌─────────────────────────────┐
│ [라벨]              [아이콘] │  ← stat-header
│ 24건                        │  ← stat-value (32px/600)
│ ↑ +3 지난 달 대비           │  ← stat-trend
└─────────────────────────────┘
```

- 보더: 1px `#e4e4e7`
- 라운드: 8px
- 패딩: 20px 24px
- 쉐도우: shadow-sm
- 그리드: 4열, gap 16px

### 5.4 Data Table

```
┌─ data-header ──────────────────────────────┐
│ [섹션 제목]                    [액션 버튼]  │
├────────────────────────────────────────────┤
│ th    th    th         th(r)    th(r)      │  ← bg: #f8f8fa
├────────────────────────────────────────────┤
│ name  type  [badge]    85.00    425.00     │
│ name  type  [badge]    —        —          │
├─ pipeline-wrapper ─────────────────────────┤
│ PIPELINE LABEL                              │
│ [block] → [block] → [block] → [+ add]     │
└────────────────────────────────────────────┘
```

- 컨테이너: 보더 1px, 라운드 8px, shadow-sm
- 헤더 패딩: 20px 24px
- 숫자 컬럼: `text-align: right`, `tabular-nums`
- 행 호버: `#fafafa`
- 행 구분선: `#f4f4f5` (마지막 행 없음)

### 5.5 Pipeline Block (파이프라인 노드)

| 상태 | Background | Border | Text | Shadow |
|------|-----------|--------|------|--------|
| `default` | `#fff` | 1px solid `#e4e4e7` | `#09090b` / 600 | shadow-sm |
| `disabled` (추가) | transparent | 1px dashed `#e4e4e7` | `#71717a` | none |

- 패딩: 8px 14px
- 라운드: 6px
- 아이콘: 14px, color `#71717a`
- 아이콘 + 텍스트 gap: 8px
- 블록 간 화살표: chevron-right SVG, color `#a1a1aa`
- 컨테이너: bg `#f8f8fa`, 패딩 24px

### 5.6 Sidebar Navigation

| 상태 | Background | Text | Font Weight |
|------|-----------|------|-------------|
| `default` | transparent | `#71717a` | 500 |
| `hover` | `#f1f1f4` | `#09090b` | 500 |
| `active` | `#f1f1f4` | `#09090b` | 600 |

- 아이콘: 16px stroke, opacity 0.7 (active: 1.0)
- 아이콘 + 텍스트 gap: 10px
- 항목 패딩: 8px 12px
- 라운드: 6px
- 그룹 라벨: 11px / 600 / uppercase / letter-spacing 0.05em / color `#a1a1aa`

### 5.7 Topbar

- 높이: 64px
- 보더: bottom 1px `#f4f4f5`
- Breadcrumb: 13px / 500, 현재 페이지 600 + `#09090b`
- 구분자: chevron-right SVG 14px, color `#a1a1aa`
- 아바타: 32px 원, bg `#f8f8fa`, 보더 1px `#e4e4e7`, 텍스트 12px / 600

## 6. Icon 규칙

| 위치 | Size | Stroke Width | Style |
|------|------|-------------|-------|
| 사이드바 | 16px | 2 | outline (stroke) |
| 파이프라인 블록 | 14px | 2 | outline (stroke) |
| 버튼 내 | 16px | 2 | outline (stroke) |
| 통계 카드 | 16px | 2 | outline (stroke) |

- 라이브러리: Heroicons v2 (outline) 또는 Lucide Icons
- 스타일: 반드시 outline/stroke, filled 사용 금지
- 색상: `currentColor` 상속

## 7. Ant Design v5 Theme Token 매핑

```typescript
// packages/frontend/src/shared/theme/token.ts

import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // Primary (모노크롬)
    colorPrimary: '#18181b',
    colorPrimaryHover: '#27272a',

    // Text
    colorText: '#09090b',
    colorTextSecondary: '#71717a',
    colorTextTertiary: '#a1a1aa',

    // Background
    colorBgContainer: '#ffffff',
    colorBgLayout: '#ffffff',
    colorBgElevated: '#ffffff',

    // Border
    colorBorder: '#e4e4e7',
    colorBorderSecondary: '#f4f4f5',

    // Border Radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // Shadow
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',

    // Font
    fontFamily: "'Inter', 'Pretendard', -apple-system, sans-serif",
    fontSize: 14,

    // Semantic
    colorSuccess: '#16a34a',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',

    // Control
    controlHeight: 36,
    controlHeightSM: 32,
  },
  components: {
    Button: {
      fontWeight: 600,
      primaryShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    Table: {
      headerBg: '#f8f8fa',
      headerColor: '#71717a',
      rowHoverBg: '#fafafa',
      borderColor: '#f4f4f5',
      headerBorderRadius: 0,
    },
    Card: {
      paddingLG: 24,
    },
    Menu: {
      itemBg: 'transparent',
      itemHoverBg: '#f1f1f4',
      itemSelectedBg: '#f1f1f4',
      itemSelectedColor: '#09090b',
      itemColor: '#71717a',
    },
    Input: {
      activeBorderColor: '#18181b',
      hoverBorderColor: '#d4d4d8',
    },
    Tag: {
      borderRadiusSM: 999,
    },
  },
};
```

## 8. 상세 문서

| 문서 | 내용 |
|------|------|
| [premium-saas.html](premium-saas.html) | 디자인 기준 HTML 목업 |
| [color-palette-compare.html](color-palette-compare.html) | 디자인 방향 비교 (Academic / Data Pro / Soft Minimal) |
