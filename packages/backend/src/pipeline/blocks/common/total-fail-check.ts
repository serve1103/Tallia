import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput, FailFlag } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'total_fail_check',
  name: '전체 과락 판정',
  category: 'postprocess',
  applicableTypes: ['A', 'B', 'C', 'D'],
  inputShape: 'SCALAR',
  outputShape: 'SCALAR',
  params: [{ key: 'threshold', label: '과락 기준 점수', type: 'number', required: true }],
};

export const totalFailCheckBlock: BlockHandler = {
  definition,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const data = input.data as { value: number };
    const threshold = (params.threshold as number) ?? 0;
    const failFlags: FailFlag[] = [];

    if (threshold > 0 && data.value < threshold) {
      failFlags.push({ type: 'total', name: '전체', value: data.value, threshold });
    }

    return { data, failFlags };
  },
};
