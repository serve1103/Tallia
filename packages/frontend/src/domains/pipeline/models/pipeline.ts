import type {
  EvalConfig,
  PipelineBlock,
  TypeAConfig,
  TypeBConfig,
  TypeCConfig,
  TypeDConfig,
} from '@tallia/shared';

export {
  getCategoryColor,
  getCategoryLabel,
  getCategoryGroup,
  getCategoryStyle,
  getCategoryVariant,
  getGroupColor,
  getGroupLabel,
  getGroupStyle,
  getGroupVariant,
  CATEGORY_DISPLAY_ORDER,
} from '../../../shared/lib/block-category';
export type { CategoryGroup } from '../../../shared/lib/block-category';

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

export function createEmptyBlock(type: string): PipelineBlock {
  return { type, params: {}, decimal: null };
}

function block(type: string, params: Record<string, unknown> = {}): PipelineBlock {
  return { type, params, decimal: null };
}

/**
 * 평가 config 와 환산 만점을 읽어 상황에 맞는 파이프라인을 자동 구성.
 * 각 유형의 설정(가중치/과락기준/만점)을 스캔해 필요한 블록만 추가하고,
 * 정규화용 원점수 총합을 실제 config 로부터 계산해 주입.
 */
export function buildAutoPipeline(
  config: EvalConfig,
  convertedMax: number,
): PipelineBlock[] {
  if (config.type === 'A') return buildTypeAPipeline(config, convertedMax);
  if (config.type === 'B') return buildTypeBPipeline(config, convertedMax);
  if (config.type === 'C') return buildTypeCPipeline(config, convertedMax);
  return buildTypeDPipeline(config, convertedMax);
}

function buildTypeAPipeline(config: TypeAConfig, convertedMax: number): PipelineBlock[] {
  const items = config.items ?? [];
  const blocks: PipelineBlock[] = [block('sum_by_committee'), block('committee_average')];

  // 항목 중 subItems 가 있는 경우 → 소항목 가중합산 블록으로 대합산
  const hasSubItems = items.some((it) => (it.subItems?.length ?? 0) > 0);
  if (hasSubItems) {
    blocks.push(block('sub_to_parent_weighted'));
  } else {
    // 가중치가 1이 아닌 항목이 하나라도 있으면 apply_weight 삽입
    const hasCustomWeight = items.some((it) => it.weight != null && it.weight !== 1);
    if (hasCustomWeight) blocks.push(block('apply_weight'));
  }

  // 정규화용 raw 최대점수 계산
  const rawMax = items.reduce((sum, it) => {
    if (it.subItems && it.subItems.length > 0) {
      const subSum = it.subItems.reduce((s, sub) => s + (sub.maxScore ?? 0) * (sub.weight ?? 1), 0);
      return sum + subSum * (it.weight ?? 1);
    }
    return sum + (it.maxScore ?? 0) * (it.weight ?? 1);
  }, 0);
  blocks.push(block('normalize_to_max', { maxScore: rawMax > 0 ? rawMax : 100 }));
  blocks.push(block('apply_converted_max', { convertedMax }));
  return blocks;
}

function buildTypeBPipeline(config: TypeBConfig, convertedMax: number): PipelineBlock[] {
  const subjects = config.subjects ?? [];
  const blocks: PipelineBlock[] = [block('auto_grade'), block('sum_by_subject')];

  // 과목별 과락 — 하나라도 failThreshold 가 설정되어 있으면 삽입
  const hasSubjectFail = subjects.some((s) => s.failThreshold != null && s.failThreshold > 0);
  if (hasSubjectFail) blocks.push(block('subject_fail_check'));

  // 합산 — 하나라도 weight 가 기본값(1 또는 미설정)과 다르면 가중합산
  const useWeightedSum = subjects.some((s) => s.weight != null && s.weight !== 1);
  blocks.push(block(useWeightedSum ? 'subject_weighted_sum' : 'subject_sum'));

  // 전체 과락
  if (config.totalFailThreshold != null && config.totalFailThreshold > 0) {
    blocks.push(block('total_fail_check', { threshold: config.totalFailThreshold }));
  }

  // 원점수 총합 (정규화용)
  const rawMax = subjects.reduce((sum, s) => {
    const w = useWeightedSum ? (s.weight ?? 1) : 1;
    return sum + (s.maxScore ?? 0) * w;
  }, 0);
  blocks.push(block('normalize_to_max', { maxScore: rawMax > 0 ? rawMax : 100 }));
  blocks.push(block('apply_converted_max', { convertedMax }));
  return blocks;
}

function buildTypeCPipeline(config: TypeCConfig, convertedMax: number): PipelineBlock[] {
  const questions = config.questions ?? [];
  const blocks: PipelineBlock[] = [];

  // 소문항 → 대문항 집계
  const hasSubQuestions = questions.some((q) => (q.subQuestions?.length ?? 0) > 0);
  if (hasSubQuestions) {
    const useSubWeighted =
      config.parentScoreMethod === 'weighted_sum' ||
      questions.some((q) => (q.subQuestions ?? []).some((sq) => sq.weight != null && sq.weight !== 1));
    blocks.push(block(useSubWeighted ? 'sub_question_weighted_sum' : 'sub_question_sum'));
  }

  // 대문항 → 총점 집계
  const useQuestionWeighted =
    config.totalCalcMethod === 'weighted_sum' ||
    questions.some((q) => q.weight != null && q.weight !== 1);
  blocks.push(block(useQuestionWeighted ? 'question_weighted_sum' : 'question_sum'));

  // 전체 과락
  if (config.totalFailThreshold != null && config.totalFailThreshold > 0) {
    blocks.push(block('total_fail_check', { threshold: config.totalFailThreshold }));
  }

  // 정규화용 raw 최대점수
  const rawMax = questions.reduce((sum, q) => {
    const wQ = useQuestionWeighted ? (q.weight ?? 1) : 1;
    if (q.subQuestions && q.subQuestions.length > 0) {
      const subSum = q.subQuestions.reduce((s, sq) => {
        const wSub = (config.parentScoreMethod === 'weighted_sum' || (sq.weight != null && sq.weight !== 1))
          ? (sq.weight ?? 1)
          : 1;
        return s + (sq.maxScore ?? 0) * wSub;
      }, 0);
      return sum + subSum * wQ;
    }
    return sum + (q.maxScore ?? 0) * wQ;
  }, 0);
  blocks.push(block('normalize_to_max', { maxScore: rawMax > 0 ? rawMax : 100 }));
  blocks.push(block('apply_converted_max', { convertedMax }));
  return blocks;
}

function buildTypeDPipeline(config: TypeDConfig, convertedMax: number): PipelineBlock[] {
  const blocks: PipelineBlock[] = [block('mapping_lookup')];

  if (config.totalFailThreshold != null && config.totalFailThreshold > 0) {
    blocks.push(block('total_fail_check', { threshold: config.totalFailThreshold }));
  }

  const rawMax = config.maxScore && config.maxScore > 0 ? config.maxScore : 100;
  blocks.push(block('normalize_to_max', { maxScore: rawMax }));
  blocks.push(block('apply_converted_max', { convertedMax }));
  return blocks;
}
