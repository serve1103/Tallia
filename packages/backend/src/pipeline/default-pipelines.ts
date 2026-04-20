import type { PipelineBlock, StandardPipelineConfig } from '@tallia/shared';

type EvalType = 'A' | 'B' | 'C' | 'D';

function block(type: string, params: Record<string, unknown> = {}): PipelineBlock {
  return { type, params, decimal: null };
}

export function getDefaultPipeline(type: EvalType): StandardPipelineConfig {
  switch (type) {
    case 'A':
      return {
        blocks: [
          block('sum_by_committee'),
          block('committee_average'),
          block('total_fail_check', { threshold: 0 }),
          block('normalize_to_max', { maxScore: 100 }),
          block('apply_converted_max', { convertedMax: 100 }),
        ],
      };
    case 'B':
      return {
        blocks: [
          block('sum_by_subject'),
          block('subject_sum'),
          block('total_fail_check', { threshold: 0 }),
          block('normalize_to_max', { maxScore: 100 }),
          block('apply_converted_max', { convertedMax: 100 }),
        ],
      };
    case 'C':
      return {
        blocks: [
          block('sub_question_sum'),
          block('question_sum'),
          block('total_fail_check', { threshold: 0 }),
          block('normalize_to_max', { maxScore: 100 }),
          block('apply_converted_max', { convertedMax: 100 }),
        ],
      };
    case 'D':
      return {
        blocks: [
          block('mapping_lookup'),
          block('total_fail_check', { threshold: 0 }),
          block('normalize_to_max', { maxScore: 100 }),
          block('apply_converted_max', { convertedMax: 100 }),
        ],
      };
  }
}
