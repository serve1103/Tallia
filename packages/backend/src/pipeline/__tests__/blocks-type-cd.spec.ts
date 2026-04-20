import type { BlockInput, ExecutionContext } from '@tallia/shared';

import { subQuestionSumBlock, questionSumBlock, questionWeightBlock, questionFailCheckBlock, committeeAveragePerQuestionBlock } from '../blocks/type-c/c-question-blocks';
import { mappingLookupBlock } from '../blocks/type-d/mapping-lookup';

const cContext: ExecutionContext = {
  evaluationType: 'C',
  config: {
    type: 'C', committeeCount: 2,
    questions: [
      { name: '1번', maxScore: 40, weight: 1.5, failThreshold: 10, subQuestions: [
        { name: '1-1', maxScore: 20, weight: 1 },
        { name: '1-2', maxScore: 20, weight: 1 },
      ]},
      { name: '2번', maxScore: 30, weight: 1.0, failThreshold: null },
    ],
    totalFailThreshold: 60,
  } as never,
  defaultDecimal: { method: 'round', places: 2 },
};

const dContext: ExecutionContext = {
  evaluationType: 'D',
  config: { type: 'D' } as never,
  defaultDecimal: { method: 'round', places: 2 },
  mappingTable: {
    entries: [
      { conditions: { lang_type: 'TOEIC', score_min: 900, score_max: 999 }, score: 95 },
      { conditions: { lang_type: 'TOEIC', score_min: 800, score_max: 899 }, score: 85 },
      { conditions: { lang_type: 'TOEFL', score_min: 100, score_max: 120 }, score: 90 },
    ],
  },
};

describe('C유형 블록', () => {
  it('sub_question_sum: 소문항 합산→대문항', () => {
    const data = { items: ['1-1', '1-2', '2번'], data: [15, 18, 25] };
    const result = subQuestionSumBlock.execute({ data, context: cContext }, {});
    const out = result.data as { items: string[]; data: number[] };
    expect(out.items).toEqual(['1번', '2번']);
    expect(out.data).toEqual([33, 25]);
  });

  it('question_weight: 문항 가중치 적용', () => {
    const data = { items: ['1번', '2번'], data: [33, 25] };
    const result = questionWeightBlock.execute({ data, context: cContext }, {});
    const out = result.data as { data: number[] };
    expect(out.data[0]).toBeCloseTo(49.5); // 33 * 1.5
    expect(out.data[1]).toBe(25); // 25 * 1.0
  });

  it('question_sum: 문항 합산', () => {
    const data = { items: ['1번', '2번'], data: [49.5, 25] };
    const result = questionSumBlock.execute({ data, context: cContext }, {});
    expect((result.data as { value: number }).value).toBeCloseTo(74.5);
  });

  it('question_fail_check: 과락 판정', () => {
    const data = { items: ['1번', '2번'], data: [8, 25] };
    const result = questionFailCheckBlock.execute({ data, context: cContext }, {});
    expect(result.failFlags).toHaveLength(1);
    expect(result.failFlags![0].name).toBe('1번');
  });
});

describe('C유형 복수위원 블록', () => {
  it('committee_average_per_question: 위원 배열 → 문항별 평균', () => {
    // 위원 2명, 문항 3개 (1-1, 2-1, 2-2)
    const data = {
      questions: {
        '1-1': [15, 14],   // 평균 14.5
        '2-1': [28, 30],   // 평균 29
        '2-2': [20, 22],   // 평균 21
      },
    };
    const result = committeeAveragePerQuestionBlock.execute({ data, context: cContext }, {});
    const out = result.data as { items: string[]; data: number[] };
    expect(out.items).toEqual(['1-1', '2-1', '2-2']);
    expect(out.data[0]).toBeCloseTo(14.5);
    expect(out.data[1]).toBeCloseTo(29);
    expect(out.data[2]).toBeCloseTo(21);
  });

  it('committee_average_per_question: 단일 위원도 정상 처리', () => {
    const data = {
      questions: {
        'Q1': [30],
        'Q2': [25],
      },
    };
    const result = committeeAveragePerQuestionBlock.execute({ data, context: cContext }, {});
    const out = result.data as { items: string[]; data: number[] };
    expect(out.data[0]).toBe(30);
    expect(out.data[1]).toBe(25);
  });
});

describe('D유형 블록', () => {
  it('mapping_lookup: TOEIC 900 → 95점', () => {
    const data = { conditions: { lang_type: 'TOEIC', score: 950 } };
    const result = mappingLookupBlock.execute({ data, context: dContext }, {});
    expect((result.data as { value: number }).value).toBe(95);
  });

  it('mapping_lookup: TOEIC 850 → 85점', () => {
    const data = { conditions: { lang_type: 'TOEIC', score: 850 } };
    const result = mappingLookupBlock.execute({ data, context: dContext }, {});
    expect((result.data as { value: number }).value).toBe(85);
  });

  it('mapping_lookup: 매칭 실패 → failFlag', () => {
    const data = { conditions: { lang_type: 'JLPT', score: 100 } };
    const result = mappingLookupBlock.execute({ data, context: dContext }, {});
    expect((result.data as { value: number }).value).toBe(0);
    expect(result.failFlags).toHaveLength(1);
    expect(result.failFlags![0].name).toBe('매핑 실패');
  });
});
