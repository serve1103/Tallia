import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'mapping_lookup',
  name: '점수 변환표 조회',
  category: 'mapping',
  applicableTypes: ['D'],
  inputShape: 'MAPPING_INPUT',
  outputShape: 'SCALAR',
  params: [],
};

interface MappingEntry {
  conditions: Record<string, string | number>;
  score: number;
}

export const mappingLookupBlock: BlockHandler = {
  definition,
  execute(input: BlockInput): BlockOutput {
    const data = input.data as { conditions: Record<string, string | number> };
    const entries = (input.context.mappingTable as { entries: MappingEntry[] })?.entries ?? [];

    const matched = entries.find((entry) => {
      return Object.entries(entry.conditions).every(([key, val]) => {
        const inputVal = data.conditions[key];
        if (inputVal === undefined) return false;

        // 구간 매칭: score_min/score_max
        if (key.endsWith('_min')) {
          const baseKey = key.replace('_min', '');
          return Number(data.conditions[baseKey] ?? data.conditions[key]) >= Number(val);
        }
        if (key.endsWith('_max')) {
          const baseKey = key.replace('_max', '');
          return Number(data.conditions[baseKey] ?? data.conditions[key]) <= Number(val);
        }

        // 정확 매칭
        return String(inputVal) === String(val);
      });
    });

    if (!matched) {
      return { data: { value: 0 }, failFlags: [{ type: 'total', name: '매핑 실패', value: 0, threshold: 0 }] };
    }

    return { data: { value: matched.score } };
  },
};
