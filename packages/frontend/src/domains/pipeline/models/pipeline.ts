import type { BlockCategory, PipelineBlock } from '@tallia/shared';

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  preprocess: '전처리',
  path1: '위원 총점',
  path2: '항목별 계산',
  aggregate: '집계',
  postprocess: '후처리',
  grading: '채점',
  mapping: '매핑',
};

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  preprocess: 'blue',
  path1: 'purple',
  path2: 'magenta',
  aggregate: 'orange',
  postprocess: 'green',
  grading: 'cyan',
  mapping: 'gold',
};

export function getCategoryLabel(category: BlockCategory): string {
  return CATEGORY_LABELS[category];
}

export function getCategoryColor(category: BlockCategory): string {
  return CATEGORY_COLORS[category];
}

export function createEmptyBlock(type: string): PipelineBlock {
  return { type, params: {}, decimal: null };
}
