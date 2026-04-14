import type { BlockInput, ExecutionContext } from '@tallia/shared';

import { customBonusBlock } from '../blocks/custom/custom-bonus';
import { customRatioBlock } from '../blocks/custom/custom-ratio';
import { customClampBlock } from '../blocks/custom/custom-clamp';
import { customRangeMapBlock } from '../blocks/custom/custom-range-map';
import { customFormulaBlock } from '../blocks/custom/custom-formula';

const baseContext: ExecutionContext = {
  evaluationType: 'A',
  config: { type: 'A' } as never,
  defaultDecimal: { method: 'round', places: 2 },
};

function input(value: number): BlockInput {
  return { data: { value }, context: baseContext };
}

describe('custom_bonus', () => {
  it('조건 충족 → 가산점', () => {
    const result = customBonusBlock.execute(input(85), { condition: 80, bonusScore: 5 });
    expect((result.data as { value: number }).value).toBe(90);
  });

  it('조건 미달 → 그대로', () => {
    const result = customBonusBlock.execute(input(75), { condition: 80, bonusScore: 5 });
    expect((result.data as { value: number }).value).toBe(75);
  });
});

describe('custom_ratio', () => {
  it('비율 적용', () => {
    const result = customRatioBlock.execute(input(100), { ratio: 0.6 });
    expect((result.data as { value: number }).value).toBe(60);
  });
});

describe('custom_clamp', () => {
  it('상한 초과 → 상한', () => {
    const result = customClampBlock.execute(input(120), { min: 0, max: 100 });
    expect((result.data as { value: number }).value).toBe(100);
  });

  it('하한 미달 → 하한', () => {
    const result = customClampBlock.execute(input(-5), { min: 0, max: 100 });
    expect((result.data as { value: number }).value).toBe(0);
  });

  it('범위 내 → 그대로', () => {
    const result = customClampBlock.execute(input(50), { min: 0, max: 100 });
    expect((result.data as { value: number }).value).toBe(50);
  });
});

describe('custom_range_map', () => {
  it('구간 매칭', () => {
    const ranges = [
      { min: 90, max: 100, value: 50 },
      { min: 80, max: 89, value: 40 },
      { min: 0, max: 79, value: 30 },
    ];
    expect((customRangeMapBlock.execute(input(95), { ranges }).data as { value: number }).value).toBe(50);
    expect((customRangeMapBlock.execute(input(85), { ranges }).data as { value: number }).value).toBe(40);
    expect((customRangeMapBlock.execute(input(70), { ranges }).data as { value: number }).value).toBe(30);
  });
});

describe('custom_formula', () => {
  it('기본 수식 실행', () => {
    const result = customFormulaBlock.execute(input(80), { expression: 'score * 0.6 + 10' });
    expect((result.data as { value: number }).value).toBe(58);
  });

  it('허용 함수 사용', () => {
    const result = customFormulaBlock.execute(input(85.7), { expression: 'round(score)' });
    expect((result.data as { value: number }).value).toBe(86);
  });

  it('금지된 변수 → 에러', () => {
    expect(() => {
      customFormulaBlock.execute(input(80), { expression: 'process.exit()' });
    }).toThrow(); // AccessorNode → 프로퍼티 접근 금지
  });

  it('금지된 함수 정의 → 에러', () => {
    expect(() => {
      customFormulaBlock.execute(input(80), { expression: 'f(x) = x * 2' });
    }).toThrow();
  });
});
