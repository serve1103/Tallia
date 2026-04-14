import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'custom_bonus',
  name: '가산점 부여',
  category: 'postprocess',
  applicableTypes: ['A', 'B', 'C', 'D'],
  inputShape: 'SCALAR',
  outputShape: 'SCALAR',
  params: [
    { key: 'condition', label: '조건 (최소 점수)', type: 'number', required: true },
    { key: 'bonusScore', label: '가산점', type: 'number', required: true },
  ],
};

export const customBonusBlock: BlockHandler = {
  definition,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const data = input.data as { value: number };
    const condition = params.condition as number;
    const bonus = params.bonusScore as number;
    const value = data.value >= condition ? data.value + bonus : data.value;
    return { data: { value } };
  },
};
