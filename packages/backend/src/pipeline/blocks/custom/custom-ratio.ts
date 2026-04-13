import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'custom_ratio',
  name: '비율 조정',
  category: 'postprocess',
  applicableTypes: ['A', 'B', 'C', 'D'],
  inputShape: 'SCALAR',
  outputShape: 'SCALAR',
  params: [{ key: 'ratio', label: '비율', type: 'number', required: true }],
};

export const customRatioBlock: BlockHandler = {
  definition,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const data = input.data as { value: number };
    const ratio = params.ratio as number;
    return { data: { value: data.value * ratio } };
  },
};
