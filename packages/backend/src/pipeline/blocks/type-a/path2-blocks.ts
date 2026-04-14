import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

// --- 항목별 계산 방식 (path2) ---

const addVirtualPerItemDef: BlockDefinition = {
  type: 'add_virtual_per_item', name: '항목별 가상 위원 추가', category: 'path2',
  applicableTypes: ['A', 'C'], inputShape: 'MATRIX', outputShape: 'MATRIX', params: [],
};

export const addVirtualPerItemBlock: BlockHandler = {
  definition: addVirtualPerItemDef,
  execute(input: BlockInput): BlockOutput {
    const { items, data } = input.data as { items: string[]; data: number[][] };
    const newData = data.map((row) => {
      const avg = row.reduce((s, v) => s + v, 0) / row.length;
      return [...row, avg];
    });
    return { data: { items, data: newData } };
  },
};

const excludeMaxPerItemDef: BlockDefinition = {
  type: 'exclude_max_per_item', name: '항목별 최고점 제외', category: 'path2',
  applicableTypes: ['A', 'C'], inputShape: 'MATRIX', outputShape: 'MATRIX', params: [],
};

export const excludeMaxPerItemBlock: BlockHandler = {
  definition: excludeMaxPerItemDef,
  execute(input: BlockInput): BlockOutput {
    const { items, data } = input.data as { items: string[]; data: number[][] };
    const newData = data.map((row) => {
      const maxIdx = row.indexOf(Math.max(...row));
      return row.filter((_, i) => i !== maxIdx);
    });
    return { data: { items, data: newData } };
  },
};

const excludeMinPerItemDef: BlockDefinition = {
  type: 'exclude_min_per_item', name: '항목별 최저점 제외', category: 'path2',
  applicableTypes: ['A', 'C'], inputShape: 'MATRIX', outputShape: 'MATRIX', params: [],
};

export const excludeMinPerItemBlock: BlockHandler = {
  definition: excludeMinPerItemDef,
  execute(input: BlockInput): BlockOutput {
    const { items, data } = input.data as { items: string[]; data: number[][] };
    const newData = data.map((row) => {
      const minIdx = row.indexOf(Math.min(...row));
      return row.filter((_, i) => i !== minIdx);
    });
    return { data: { items, data: newData } };
  },
};

const averagePerItemDef: BlockDefinition = {
  type: 'average_per_item', name: '항목별 위원 평균', category: 'path2',
  applicableTypes: ['A', 'C'], inputShape: 'MATRIX', outputShape: 'ARRAY', params: [],
};

export const averagePerItemBlock: BlockHandler = {
  definition: averagePerItemDef,
  execute(input: BlockInput): BlockOutput {
    const { items, data } = input.data as { items: string[]; data: number[][] };
    const averages = data.map((row) => row.length > 0 ? row.reduce((s, v) => s + v, 0) / row.length : 0);
    return { data: { labels: items, data: averages } };
  },
};

const sumPerItemDef: BlockDefinition = {
  type: 'sum_per_item', name: '항목별 위원 합산', category: 'path2',
  applicableTypes: ['A', 'C'], inputShape: 'MATRIX', outputShape: 'ARRAY', params: [],
};

export const sumPerItemBlock: BlockHandler = {
  definition: sumPerItemDef,
  execute(input: BlockInput): BlockOutput {
    const { items, data } = input.data as { items: string[]; data: number[][] };
    const sums = data.map((row) => row.reduce((s, v) => s + v, 0));
    return { data: { labels: items, data: sums } };
  },
};

const applyWeightDef: BlockDefinition = {
  type: 'apply_weight', name: '가중치 적용', category: 'path2',
  applicableTypes: ['A', 'C'], inputShape: 'ARRAY', outputShape: 'ARRAY', params: [],
};

export const applyWeightBlock: BlockHandler = {
  definition: applyWeightDef,
  execute(input: BlockInput): BlockOutput {
    const { labels, data } = input.data as { labels: string[]; data: number[] };
    const config = input.context.config as { items: { weight: number }[] };
    const weighted = data.map((v, i) => v * (config.items[i]?.weight ?? 1));
    return { data: { labels, data: weighted } };
  },
};

const subToParentSumDef: BlockDefinition = {
  type: 'sub_to_parent_sum', name: '소항목 합산→대항목', category: 'path2',
  applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'ARRAY', params: [],
};

export const subToParentSumBlock: BlockHandler = {
  definition: subToParentSumDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { labels: string[]; data: number[] };
    const config = input.context.config as { items: { name: string; subItems?: unknown[] }[] };
    const result: { labels: string[]; data: number[] } = { labels: [], data: [] };
    let idx = 0;
    for (const item of config.items) {
      const subCount = item.subItems?.length ?? 1;
      const sum = data.slice(idx, idx + subCount).reduce((s, v) => s + v, 0);
      result.labels.push(item.name);
      result.data.push(sum);
      idx += subCount;
    }
    return { data: result };
  },
};

const subToParentWeightedDef: BlockDefinition = {
  type: 'sub_to_parent_weighted', name: '소항목 가중합산→대항목', category: 'path2',
  applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'ARRAY', params: [],
};

export const subToParentWeightedBlock: BlockHandler = {
  definition: subToParentWeightedDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { labels: string[]; data: number[] };
    const config = input.context.config as { items: { name: string; weight: number; subItems?: { weight: number }[] }[] };
    const result: { labels: string[]; data: number[] } = { labels: [], data: [] };
    let idx = 0;
    for (const item of config.items) {
      const subs = item.subItems ?? [{ weight: 1 }];
      let sum = 0;
      for (const sub of subs) {
        sum += (data[idx] ?? 0) * (sub.weight ?? 1);
        idx++;
      }
      result.labels.push(item.name);
      result.data.push(sum * (item.weight ?? 1));
    }
    return { data: result };
  },
};

const itemSumDef: BlockDefinition = {
  type: 'item_sum', name: '항목 합산', category: 'path2',
  applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'SCALAR', params: [],
};

export const itemSumBlock: BlockHandler = {
  definition: itemSumDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { data: number[] };
    return { data: { value: data.reduce((s, v) => s + v, 0) } };
  },
};

const itemAverageDef: BlockDefinition = {
  type: 'item_average', name: '항목 평균', category: 'path2',
  applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'SCALAR', params: [],
};

export const itemAverageBlock: BlockHandler = {
  definition: itemAverageDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { data: number[] };
    const avg = data.length > 0 ? data.reduce((s, v) => s + v, 0) / data.length : 0;
    return { data: { value: avg } };
  },
};
