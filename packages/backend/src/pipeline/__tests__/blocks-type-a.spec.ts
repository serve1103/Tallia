import type { BlockInput, ExecutionContext } from '@tallia/shared';

import { sumByCommitteeBlock, excludeMaxCommitteeBlock, excludeMinCommitteeBlock, committeeAverageBlock, committeeSumBlock } from '../blocks/type-a/path1-blocks';
import { averagePerItemBlock, sumPerItemBlock, itemSumBlock, itemAverageBlock } from '../blocks/type-a/path2-blocks';

const baseContext: ExecutionContext = {
  evaluationType: 'A',
  config: { type: 'A', maxCommitteeCount: 3, dataType: 'score', items: [{ name: '인성', weight: 1 }, { name: '전공', weight: 2 }] } as never,
  defaultDecimal: { method: 'round', places: 2 },
};

function input(data: unknown): BlockInput {
  return { data, context: baseContext };
}

describe('A유형 path1 블록', () => {
  it('sum_by_committee: 위원별 항목 합산', () => {
    // items[0] = [80, 90, 70], items[1] = [60, 70, 80]
    const data = { items: ['인성', '전공'], data: [[80, 90, 70], [60, 70, 80]] };
    const result = sumByCommitteeBlock.execute(input(data), {});
    const out = result.data as { labels: string[]; data: number[] };
    expect(out.data).toEqual([140, 160, 150]); // 위원1: 80+60, 위원2: 90+70, 위원3: 70+80
  });

  it('exclude_max_committee: 최고 위원 제외', () => {
    const data = { labels: ['위원1', '위원2', '위원3'], data: [140, 160, 150] };
    const result = excludeMaxCommitteeBlock.execute(input(data), {});
    const out = result.data as { data: number[] };
    expect(out.data).toEqual([140, 150]); // 160 제외
  });

  it('exclude_min_committee: 최저 위원 제외', () => {
    const data = { labels: ['위원1', '위원2', '위원3'], data: [140, 160, 150] };
    const result = excludeMinCommitteeBlock.execute(input(data), {});
    const out = result.data as { data: number[] };
    expect(out.data).toEqual([160, 150]); // 140 제외
  });

  it('committee_average: 위원 평균', () => {
    const data = { labels: ['위원1', '위원2'], data: [140, 160] };
    const result = committeeAverageBlock.execute(input(data), {});
    expect((result.data as { value: number }).value).toBe(150);
  });

  it('committee_sum: 위원 합산', () => {
    const data = { labels: ['위원1', '위원2'], data: [140, 160] };
    const result = committeeSumBlock.execute(input(data), {});
    expect((result.data as { value: number }).value).toBe(300);
  });
});

describe('A유형 path2 블록', () => {
  it('average_per_item: 항목별 위원 평균', () => {
    const data = { items: ['인성', '전공'], data: [[80, 90, 70], [60, 70, 80]] };
    const result = averagePerItemBlock.execute(input(data), {});
    const out = result.data as { data: number[] };
    expect(out.data[0]).toBe(80); // (80+90+70)/3
    expect(out.data[1]).toBeCloseTo(70); // (60+70+80)/3
  });

  it('sum_per_item: 항목별 위원 합산', () => {
    const data = { items: ['인성', '전공'], data: [[80, 90, 70], [60, 70, 80]] };
    const result = sumPerItemBlock.execute(input(data), {});
    const out = result.data as { data: number[] };
    expect(out.data).toEqual([240, 210]);
  });

  it('item_sum: 항목 합산', () => {
    const data = { labels: ['인성', '전공'], data: [80, 70] };
    const result = itemSumBlock.execute(input(data), {});
    expect((result.data as { value: number }).value).toBe(150);
  });

  it('item_average: 항목 평균', () => {
    const data = { labels: ['인성', '전공'], data: [80, 70] };
    const result = itemAverageBlock.execute(input(data), {});
    expect((result.data as { value: number }).value).toBe(75);
  });
});
