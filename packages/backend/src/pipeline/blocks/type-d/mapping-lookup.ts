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
        // 구간 매칭: score_min → 입력의 score와 비교
        if (key.endsWith('_min')) {
          const baseKey = key.replace('_min', '');
          const inputVal = data.conditions[baseKey];
          if (inputVal === undefined) return false;
          return Number(inputVal) >= Number(val);
        }
        if (key.endsWith('_max')) {
          const baseKey = key.replace('_max', '');
          const inputVal = data.conditions[baseKey];
          if (inputVal === undefined) return false;
          return Number(inputVal) <= Number(val);
        }

        // 정확 매칭
        const inputVal = data.conditions[key];
        if (inputVal === undefined) return false;
        return String(inputVal) === String(val);
      });
    });

    if (!matched) {
      return { data: { value: 0 }, failFlags: [{ type: 'total', name: '매핑 실패', value: 0, threshold: 0 }] };
    }

    return { data: { value: matched.score } };
  },
};
