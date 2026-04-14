import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

// --- 위원 총점 방식 (path1) ---

const sumByCommitteeDef: BlockDefinition = {
  type: 'sum_by_committee', name: '위원별 항목 합산', category: 'path1',
  applicableTypes: ['A'], inputShape: 'MATRIX', outputShape: 'ARRAY', params: [],
};

export const sumByCommitteeBlock: BlockHandler = {
  definition: sumByCommitteeDef,
  execute(input: BlockInput): BlockOutput {
    const { items, data } = input.data as { items: string[]; data: number[][] };
    // data[row][col] → 위원별 합산: 각 열(위원)에 대해 행(항목) 합
    const committeeTotals = data[0]?.map((_, col) => data.reduce((sum, row) => sum + (row[col] ?? 0), 0)) ?? [];
    return { data: { labels: items.map((_, i) => `위원${i + 1}`), data: committeeTotals } };
  },
};

const weightedSumByCommitteeDef: BlockDefinition = {
  type: 'weighted_sum_by_committee', name: '위원별 항목 가중합산', category: 'path1',
  applicableTypes: ['A'], inputShape: 'MATRIX', outputShape: 'ARRAY', params: [],
};

export const weightedSumByCommitteeBlock: BlockHandler = {
  definition: weightedSumByCommitteeDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { items: string[]; data: number[][] };
    const config = input.context.config as { items: { weight: number }[] };
    const weights = config.items.map((item) => item.weight ?? 1);
    const committeeTotals = data[0]?.map((_, col) =>
      data.reduce((sum, row, rowIdx) => sum + (row[col] ?? 0) * (weights[rowIdx] ?? 1), 0),
    ) ?? [];
    return { data: { labels: committeeTotals.map((_, i) => `위원${i + 1}`), data: committeeTotals } };
  },
};

const addVirtualCommitteeDef: BlockDefinition = {
  type: 'add_virtual_committee', name: '가상 위원 추가', category: 'path1',
  applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'ARRAY',
  params: [{ key: 'method', label: '방법', type: 'select', required: true, options: [{ label: '평균', value: 'average' }, { label: '중앙값', value: 'median' }] }],
};

export const addVirtualCommitteeBlock: BlockHandler = {
  definition: addVirtualCommitteeDef,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const { labels, data } = input.data as { labels: string[]; data: number[] };
    const method = (params.method as string) ?? 'average';
    let virtualScore: number;
    if (method === 'median') {
      const sorted = [...data].sort((a, b) => a - b);
      virtualScore = sorted[Math.floor(sorted.length / 2)];
    } else {
      virtualScore = data.reduce((s, v) => s + v, 0) / data.length;
    }
    return { data: { labels: [...labels, '가상위원'], data: [...data, virtualScore] } };
  },
};

const excludeMaxCommitteeDef: BlockDefinition = {
  type: 'exclude_max_committee', name: '최고 위원 제외', category: 'path1',
  applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'ARRAY', params: [],
};

export const excludeMaxCommitteeBlock: BlockHandler = {
  definition: excludeMaxCommitteeDef,
  execute(input: BlockInput): BlockOutput {
    const { labels, data } = input.data as { labels: string[]; data: number[] };
    const maxIdx = data.indexOf(Math.max(...data));
    return { data: { labels: labels.filter((_, i) => i !== maxIdx), data: data.filter((_, i) => i !== maxIdx) } };
  },
};

const excludeMinCommitteeDef: BlockDefinition = {
  type: 'exclude_min_committee', name: '최저 위원 제외', category: 'path1',
  applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'ARRAY', params: [],
};

export const excludeMinCommitteeBlock: BlockHandler = {
  definition: excludeMinCommitteeDef,
  execute(input: BlockInput): BlockOutput {
    const { labels, data } = input.data as { labels: string[]; data: number[] };
    const minIdx = data.indexOf(Math.min(...data));
    return { data: { labels: labels.filter((_, i) => i !== minIdx), data: data.filter((_, i) => i !== minIdx) } };
  },
};

const committeeAverageDef: BlockDefinition = {
  type: 'committee_average', name: '위원 평균', category: 'path1',
  applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'SCALAR', params: [],
};

export const committeeAverageBlock: BlockHandler = {
  definition: committeeAverageDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { data: number[] };
    const avg = data.length > 0 ? data.reduce((s, v) => s + v, 0) / data.length : 0;
    return { data: { value: avg } };
  },
};

const committeeSumDef: BlockDefinition = {
  type: 'committee_sum', name: '위원 합산', category: 'path1',
  applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'SCALAR', params: [],
};

export const committeeSumBlock: BlockHandler = {
  definition: committeeSumDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { data: number[] };
    return { data: { value: data.reduce((s, v) => s + v, 0) } };
  },
};
