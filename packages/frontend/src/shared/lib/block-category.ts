import type { BlockCategory } from '@tallia/shared';
import type { StatusVariant } from '../components/StatusTag';

/**
 * 블록 카테고리는 내부적으로 7종(preprocess/grading/mapping/path1/path2/aggregate/postprocess) 이지만
 * UI 상에서는 파이프라인 실행 흐름에 맞춘 3그룹으로 묶어 표시한다.
 *   - 전처리: preprocess, grading, mapping
 *   - 중간 과정: path1, path2, aggregate
 *   - 후처리: postprocess
 */
export type CategoryGroup = 'preprocess' | 'middle' | 'postprocess';

const GROUP_OF_CATEGORY: Record<BlockCategory, CategoryGroup> = {
  preprocess: 'preprocess',
  grading: 'preprocess',
  mapping: 'preprocess',
  path1: 'middle',
  path2: 'middle',
  aggregate: 'middle',
  postprocess: 'postprocess',
};

const GROUP_LABELS: Record<CategoryGroup, string> = {
  preprocess: '전처리',
  middle: '중간 과정',
  postprocess: '후처리',
};

/** Tallia 디자인 시스템 §2.5 Semantic 팔레트에 맞춘 그룹별 Tag 스타일.
 *  전처리 = Info(blue), 중간 과정 = Warning(amber), 후처리 = Success(green). */
interface GroupStyle {
  background: string;
  color: string;
  borderColor: string;
}
const GROUP_STYLES: Record<CategoryGroup, GroupStyle> = {
  preprocess: { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
  middle: { background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' },
  postprocess: { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' },
};

/** 하위 호환용 — AntD Tag color 이름. style 로 덮어쓰는 쪽을 권장. */
const GROUP_COLORS: Record<CategoryGroup, string> = {
  preprocess: 'blue',
  middle: 'gold',
  postprocess: 'green',
};

export const CATEGORY_DISPLAY_ORDER: CategoryGroup[] = ['preprocess', 'middle', 'postprocess'];

/** 카테고리만으로는 그룹을 판정하기 어려운 블록을 type 기준으로 강제 매핑.
 *  예: total_fail_check 는 category=postprocess 지만 "과락 판정"이므로 중간과정이 자연스러움. */
const TYPE_GROUP_OVERRIDE: Record<string, CategoryGroup> = {
  total_fail_check: 'middle',
  subject_fail_check: 'middle',
  item_fail_check: 'middle',
  question_fail_check: 'middle',
};

export function getCategoryGroup(
  category: BlockCategory,
  blockType?: string,
): CategoryGroup {
  if (blockType && TYPE_GROUP_OVERRIDE[blockType]) {
    return TYPE_GROUP_OVERRIDE[blockType];
  }
  return GROUP_OF_CATEGORY[category] ?? 'middle';
}

/** 블록 카테고리 → 사용자에게 보여줄 한글 그룹 라벨. */
export function getCategoryLabel(category: BlockCategory, blockType?: string): string {
  return GROUP_LABELS[getCategoryGroup(category, blockType)];
}

/** 블록 카테고리 → AntD Tag 용 색상. 같은 그룹이면 동일 색. */
export function getCategoryColor(category: BlockCategory, blockType?: string): string {
  return GROUP_COLORS[getCategoryGroup(category, blockType)];
}

export function getGroupLabel(group: CategoryGroup): string {
  return GROUP_LABELS[group];
}

export function getGroupColor(group: CategoryGroup): string {
  return GROUP_COLORS[group];
}

/** 그룹에 해당하는 디자인 시스템 Semantic 스타일 (bg/text/border). Tag style prop 에 전개해서 사용. */
export function getGroupStyle(group: CategoryGroup): GroupStyle {
  return GROUP_STYLES[group];
}

export function getCategoryStyle(category: BlockCategory, blockType?: string): GroupStyle {
  return GROUP_STYLES[getCategoryGroup(category, blockType)];
}

/** 그룹 → StatusTag variant 매핑 (디자인 시스템 Semantic). */
const GROUP_VARIANT: Record<CategoryGroup, StatusVariant> = {
  preprocess: 'info',
  middle: 'warning',
  postprocess: 'success',
};

export function getGroupVariant(group: CategoryGroup): StatusVariant {
  return GROUP_VARIANT[group];
}

export function getCategoryVariant(category: BlockCategory, blockType?: string): StatusVariant {
  return GROUP_VARIANT[getCategoryGroup(category, blockType)];
}
