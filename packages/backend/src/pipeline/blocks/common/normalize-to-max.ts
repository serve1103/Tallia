import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'normalize_to_max',
  name: '만점 기준 환산',
  category: 'postprocess',
  applicableTypes: ['A', 'B', 'C', 'D'],
  inputShape: 'SCALAR',
  outputShape: 'SCALAR',
  params: [{ key: 'maxScore', label: '만점', type: 'number', required: true }],
};

export const normalizeToMaxBlock: BlockHandler = {
  definition,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const data = input.data as { value: number };
    const maxScore = (params.maxScore as number) ?? 100;
    const normalized = (data.value / maxScore) * 100;
    return { data: { value: normalized } };
  },
};
