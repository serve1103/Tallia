import type { BlockCategory, PipelineBlock } from '@tallia/shared';

export interface CustomStepTemplate {
  blockType: string;
  label: string;
  description: string;
  example: string;
  defaultParams: Record<string, unknown>;
}

export const CUSTOM_STEP_TEMPLATES: CustomStepTemplate[] = [
  {
    blockType: 'custom_bonus',
    label: '가산점 부여',
    description: '점수가 조건 이상이면 지정된 점수를 가산합니다.',
    example: '70점 이상이면 5점 가산',
    defaultParams: { condition: 70, bonusScore: 5 },
  },
  {
    blockType: 'custom_ratio',
    label: '비율 조정',
    description: '점수에 비율을 곱하여 변환합니다.',
    example: '0.6을 곱해 60% 환산',
    defaultParams: { ratio: 1.0 },
  },
  {
    blockType: 'custom_range_map',
    label: '구간 변환',
    description: '점수 구간별로 다른 값을 매핑합니다.',
    example: '90~100점 → 100, 80~89점 → 90',
    defaultParams: {
      ranges: [
        { min: 90, max: 100, value: 100 },
        { min: 80, max: 89, value: 90 },
        { min: 0, max: 79, value: 80 },
      ],
    },
  },
  {
    blockType: 'custom_clamp',
    label: '상한/하한 제한',
    description: '점수를 지정된 범위 내로 제한합니다.',
    example: '0~100 범위로 제한',
    defaultParams: { min: 0, max: 100 },
  },
  {
    blockType: 'custom_formula',
    label: '직접 수식 (고급)',
    description: '변수 기반 수식을 직접 입력합니다. 허용된 함수만 사용 가능합니다.',
    example: 'round(score * weight + bonus)',
    defaultParams: { expression: 'score' },
  },
];

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
