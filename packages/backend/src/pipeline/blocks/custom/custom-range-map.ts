import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'custom_range_map',
  name: '구간 변환',
  category: 'postprocess',
  applicableTypes: ['A', 'B', 'C', 'D'],
  inputShape: 'SCALAR',
  outputShape: 'SCALAR',
  params: [{ key: 'ranges', label: '구간 정의 (JSON)', type: 'string', required: true }],
};

interface Range { min: number; max: number; value: number }

export const customRangeMapBlock: BlockHandler = {
  definition,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const data = input.data as { value: number };
    const ranges = params.ranges as Range[];
    const matched = ranges.find((r) => data.value >= r.min && data.value <= r.max);
    return { data: { value: matched ? matched.value : data.value } };
  },
};
