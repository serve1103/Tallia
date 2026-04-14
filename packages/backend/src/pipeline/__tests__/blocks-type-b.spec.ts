import type { BlockInput, ExecutionContext } from '@tallia/shared';

import { autoGradeBlock } from '../blocks/type-b/auto-grade';
import { sumBySubjectBlock, subjectFailCheckBlock, subjectSumBlock } from '../blocks/type-b/b-aggregate-blocks';

const bContext: ExecutionContext = {
  evaluationType: 'B',
  config: {
    type: 'B',
    subjects: [{
      id: 'eng', name: '영어', questionCount: 3, maxScore: 100, failThreshold: 40,
      examTypes: [{ id: 't1', name: 'A형', questionCount: 3, answerKey: [
        { questionNo: 1, answers: ['3'], score: 10 },
        { questionNo: 2, answers: ['1', '4'], score: 10 }, // 복수정답
        { questionNo: 3, answers: ['2'], score: 10 },
      ]}],
      questionErrors: [],
    }],
    totalFailThreshold: 60,
  } as never,
  defaultDecimal: { method: 'round', places: 2 },
};

function input(data: unknown): BlockInput {
  return { data, context: bContext };
}

describe('auto_grade', () => {
  it('정답 채점', () => {
    const answers = { answers: [
      { qNo: 1, answer: '3' },
      { qNo: 2, answer: '4' }, // 복수정답 중 하나
      { qNo: 3, answer: '5' }, // 오답
    ]};
    const result = autoGradeBlock.execute(input(answers), {});
    const scores = (result.data as { scores: { qNo: number; correct: boolean; score: number }[] }).scores;
    expect(scores[0].correct).toBe(true);
    expect(scores[0].score).toBe(10);
    expect(scores[1].correct).toBe(true); // 복수정답
    expect(scores[1].score).toBe(10);
    expect(scores[2].correct).toBe(false);
    expect(scores[2].score).toBe(0);
  });
});

describe('sum_by_subject', () => {
  it('과목별 합산', () => {
    const scores = { scores: [
      { qNo: 1, correct: true, score: 10 },
      { qNo: 2, correct: true, score: 10 },
      { qNo: 3, correct: false, score: 0 },
    ]};
    const result = sumBySubjectBlock.execute(input(scores), {});
    const subjects = (result.data as { subjects: { name: string; score: number }[] }).subjects;
    expect(subjects[0].name).toBe('영어');
    expect(subjects[0].score).toBe(20);
  });
});

describe('subject_fail_check', () => {
  it('과목 과락 판정', () => {
    const data = { subjects: [{ id: 'eng', name: '영어', score: 30 }] };
    const result = subjectFailCheckBlock.execute(input(data), {});
    expect(result.failFlags).toHaveLength(1);
    expect(result.failFlags![0].name).toBe('영어');
  });

  it('과락 기준 이상 → failFlag 없음', () => {
    const data = { subjects: [{ id: 'eng', name: '영어', score: 50 }] };
    const result = subjectFailCheckBlock.execute(input(data), {});
    expect(result.failFlags).toHaveLength(0);
  });
});

describe('subject_sum', () => {
  it('과목 합산', () => {
    const data = { subjects: [{ score: 80 }, { score: 70 }] };
    const result = subjectSumBlock.execute(input(data), {});
    expect((result.data as { value: number }).value).toBe(150);
  });
});
