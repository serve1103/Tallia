/**
 * 블록 type 식별자 — 04-pipeline-engine.md §4.5~4.10 기준.
 * 스펙 문서의 type 컬럼을 정본으로 사용.
 */

// A유형 — 전처리 (§4.5)
export const BLOCK_GRADE_TO_SCORE = 'grade_to_score' as const;

// A유형 — 위원 총점 방식 (path1) (§4.5)
export const BLOCK_SUM_BY_COMMITTEE = 'sum_by_committee' as const;
export const BLOCK_WEIGHTED_SUM_BY_COMMITTEE = 'weighted_sum_by_committee' as const;
export const BLOCK_ADD_VIRTUAL_COMMITTEE = 'add_virtual_committee' as const;
export const BLOCK_EXCLUDE_MAX_COMMITTEE = 'exclude_max_committee' as const;
export const BLOCK_EXCLUDE_MIN_COMMITTEE = 'exclude_min_committee' as const;
export const BLOCK_COMMITTEE_AVERAGE = 'committee_average' as const;
export const BLOCK_COMMITTEE_SUM = 'committee_sum' as const;

// A유형 — 항목별 계산 방식 (path2) (§4.5)
export const BLOCK_ADD_VIRTUAL_PER_ITEM = 'add_virtual_per_item' as const;
export const BLOCK_EXCLUDE_MAX_PER_ITEM = 'exclude_max_per_item' as const;
export const BLOCK_EXCLUDE_MIN_PER_ITEM = 'exclude_min_per_item' as const;
export const BLOCK_AVERAGE_PER_ITEM = 'average_per_item' as const;
export const BLOCK_SUM_PER_ITEM = 'sum_per_item' as const;
export const BLOCK_APPLY_WEIGHT = 'apply_weight' as const;
export const BLOCK_SUB_TO_PARENT_SUM = 'sub_to_parent_sum' as const;
export const BLOCK_SUB_TO_PARENT_WEIGHTED = 'sub_to_parent_weighted' as const;
export const BLOCK_ITEM_SUM = 'item_sum' as const;
export const BLOCK_ITEM_AVERAGE = 'item_average' as const;

// B유형 (§4.6)
export const BLOCK_AUTO_GRADE = 'auto_grade' as const;
export const BLOCK_SUM_BY_SUBJECT = 'sum_by_subject' as const;
export const BLOCK_SUBJECT_FAIL_CHECK = 'subject_fail_check' as const;
export const BLOCK_SUBJECT_SUM = 'subject_sum' as const;
export const BLOCK_SUBJECT_WEIGHTED_SUM = 'subject_weighted_sum' as const;

// C유형 (§4.7) — A유형 path2 블록 재활용 + 문항 집계 추가
export const BLOCK_SUB_QUESTION_SUM = 'sub_question_sum' as const;
export const BLOCK_SUB_QUESTION_WEIGHTED_SUM = 'sub_question_weighted_sum' as const;
export const BLOCK_QUESTION_WEIGHT = 'question_weight' as const;
export const BLOCK_QUESTION_SUM = 'question_sum' as const;
export const BLOCK_QUESTION_WEIGHTED_SUM = 'question_weighted_sum' as const;
export const BLOCK_SUB_QUESTION_FAIL_CHECK = 'sub_question_fail_check' as const;
export const BLOCK_QUESTION_FAIL_CHECK = 'question_fail_check' as const;

// D유형 (§4.8)
export const BLOCK_MAPPING_LOOKUP = 'mapping_lookup' as const;

// 공통 후처리 (§4.9)
export const BLOCK_ITEM_FAIL_CHECK = 'item_fail_check' as const;
export const BLOCK_TOTAL_FAIL_CHECK = 'total_fail_check' as const;
export const BLOCK_NORMALIZE_TO_MAX = 'normalize_to_max' as const;
export const BLOCK_APPLY_CONVERTED_MAX = 'apply_converted_max' as const;

// 사용자 정의 (§4.10)
export const BLOCK_CUSTOM_BONUS = 'custom_bonus' as const;
export const BLOCK_CUSTOM_RATIO = 'custom_ratio' as const;
export const BLOCK_CUSTOM_RANGE_MAP = 'custom_range_map' as const;
export const BLOCK_CUSTOM_CLAMP = 'custom_clamp' as const;
export const BLOCK_CUSTOM_FORMULA = 'custom_formula' as const;

export const ALL_BLOCK_TYPES = [
  BLOCK_GRADE_TO_SCORE, BLOCK_SUM_BY_COMMITTEE, BLOCK_WEIGHTED_SUM_BY_COMMITTEE,
  BLOCK_ADD_VIRTUAL_COMMITTEE, BLOCK_EXCLUDE_MAX_COMMITTEE, BLOCK_EXCLUDE_MIN_COMMITTEE,
  BLOCK_COMMITTEE_AVERAGE, BLOCK_COMMITTEE_SUM,
  BLOCK_ADD_VIRTUAL_PER_ITEM, BLOCK_EXCLUDE_MAX_PER_ITEM, BLOCK_EXCLUDE_MIN_PER_ITEM,
  BLOCK_AVERAGE_PER_ITEM, BLOCK_SUM_PER_ITEM, BLOCK_APPLY_WEIGHT,
  BLOCK_SUB_TO_PARENT_SUM, BLOCK_SUB_TO_PARENT_WEIGHTED, BLOCK_ITEM_SUM, BLOCK_ITEM_AVERAGE,
  BLOCK_AUTO_GRADE, BLOCK_SUM_BY_SUBJECT, BLOCK_SUBJECT_FAIL_CHECK,
  BLOCK_SUBJECT_SUM, BLOCK_SUBJECT_WEIGHTED_SUM,
  BLOCK_SUB_QUESTION_SUM, BLOCK_SUB_QUESTION_WEIGHTED_SUM,
  BLOCK_QUESTION_WEIGHT, BLOCK_QUESTION_SUM, BLOCK_QUESTION_WEIGHTED_SUM,
  BLOCK_SUB_QUESTION_FAIL_CHECK, BLOCK_QUESTION_FAIL_CHECK,
  BLOCK_MAPPING_LOOKUP,
  BLOCK_ITEM_FAIL_CHECK, BLOCK_TOTAL_FAIL_CHECK,
  BLOCK_NORMALIZE_TO_MAX, BLOCK_APPLY_CONVERTED_MAX,
  BLOCK_CUSTOM_BONUS, BLOCK_CUSTOM_RATIO, BLOCK_CUSTOM_RANGE_MAP,
  BLOCK_CUSTOM_CLAMP, BLOCK_CUSTOM_FORMULA,
] as const;
export type BlockType = (typeof ALL_BLOCK_TYPES)[number];
