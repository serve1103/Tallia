import type { BlockInput, ExecutionContext } from '@tallia/shared';

import { normalizeToMaxBlock } from '../blocks/common/normalize-to-max';
import { applyConvertedMaxBlock } from '../blocks/common/apply-converted-max';
import { totalFailCheckBlock } from '../blocks/common/total-fail-check';
import { itemFailCheckBlock } from '../blocks/common/item-fail-check';

const baseContext: ExecutionContext = {
  evaluationType: 'A',
  config: { type: 'A', maxCommitteeCount: 5, dataType: 'score', items: [{ name: '인성', failThreshold: 40 }, { name: '전공', failThreshold: null }] } as never,
  defaultDecimal: { method: 'round', places: 2 },
};

function input(data: unknown): BlockInput {
  return { data, context: baseContext };
}

describe('normalize_to_max', () => {
  it('100점 만점 → 원점수 환산', () => {
    const result = normalizeToMaxBlock.execute(input({ value: 80 }), { maxScore: 200 });
    expect((result.data as { value: number }).value).toBe(40);
  });

  it('만점이 100이면 그대로', () => {
    const result = normalizeToMaxBlock.execute(input({ value: 85 }), { maxScore: 100 });
    expect((result.data as { value: number }).value).toBe(85);
  });
});

describe('apply_converted_max', () => {
  it('환산 만점 500 적용', () => {
    const result = applyConvertedMaxBlock.execute(input({ value: 85 }), { convertedMax: 500 });
    expect((result.data as { value: number }).value).toBe(425);
  });

  it('환산 만점 100 → 그대로', () => {
    const result = applyConvertedMaxBlock.execute(input({ value: 85 }), { convertedMax: 100 });
    expect((result.data as { value: number }).value).toBe(85);
  });
});

describe('total_fail_check', () => {
  it('과락 기준 미달 → failFlag', () => {
    const result = totalFailCheckBlock.execute(input({ value: 50 }), { threshold: 60 });
    expect(result.failFlags).toHaveLength(1);
    expect(result.failFlags![0].type).toBe('total');
  });

  it('과락 기준 이상 → failFlag 없음', () => {
    const result = totalFailCheckBlock.execute(input({ value: 70 }), { threshold: 60 });
    expect(result.failFlags).toHaveLength(0);
  });
});

describe('item_fail_check', () => {
  it('항목별 과락 판정', () => {
    const result = itemFailCheckBlock.execute(
      input({ labels: ['인성', '전공'], data: [35, 80] }),
      {},
    );
    expect(result.failFlags).toHaveLength(1);
    expect(result.failFlags![0].name).toBe('인성');
    expect(result.failFlags![0].value).toBe(35);
    expect(result.failFlags![0].threshold).toBe(40);
  });

  it('failThreshold null → 판정 안 함', () => {
    const result = itemFailCheckBlock.execute(
      input({ labels: ['인성', '전공'], data: [50, 30] }),
      {},
    );
    // 전공은 failThreshold null이므로 인성만 통과 → 에러 0개
    expect(result.failFlags).toHaveLength(0);
  });
});
