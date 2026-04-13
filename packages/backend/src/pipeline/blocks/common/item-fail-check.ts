import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput, FailFlag } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'item_fail_check',
  name: '항목별 과락 판정',
  category: 'postprocess',
  applicableTypes: ['A', 'B', 'C', 'D'],
  inputShape: 'ARRAY',
  outputShape: 'ARRAY',
  params: [{ key: 'thresholds', label: '항목별 과락 기준', type: 'string', required: false }],
};

export const itemFailCheckBlock: BlockHandler = {
  definition,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const data = input.data as { labels: string[]; data: number[] };
    const config = input.context.config;
    const failFlags: FailFlag[] = [];

    // config에서 항목별 failThreshold를 읽어 판정
    if (config && 'items' in config) {
      const items = (config as { items: { name: string; failThreshold: number | null }[] }).items;
      for (let i = 0; i < data.data.length && i < items.length; i++) {
        const threshold = items[i].failThreshold;
        if (threshold !== null && data.data[i] < threshold) {
          failFlags.push({ type: 'item', name: items[i].name, value: data.data[i], threshold });
        }
      }
    }

    return { data, failFlags };
  },
};
