import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'apply_converted_max',
  name: '환산 만점 적용',
  category: 'postprocess',
  applicableTypes: ['A', 'B', 'C', 'D'],
  inputShape: 'SCALAR',
  outputShape: 'SCALAR',
  params: [{ key: 'convertedMax', label: '환산 만점', type: 'number', required: true }],
};

export const applyConvertedMaxBlock: BlockHandler = {
  definition,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const data = input.data as { value: number };
    const convertedMax = (params.convertedMax as number) ?? 100;
    const converted = data.value * (convertedMax / 100);
    return { data: { value: converted } };
  },
};
