import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'custom_clamp',
  name: '상한/하한 제한',
  category: 'postprocess',
  applicableTypes: ['A', 'B', 'C', 'D'],
  inputShape: 'SCALAR',
  outputShape: 'SCALAR',
  params: [
    { key: 'min', label: '하한', type: 'number', required: true },
    { key: 'max', label: '상한', type: 'number', required: true },
  ],
};

export const customClampBlock: BlockHandler = {
  definition,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const data = input.data as { value: number };
    const min = params.min as number;
    const max = params.max as number;
    return { data: { value: Math.max(min, Math.min(max, data.value)) } };
  },
};
