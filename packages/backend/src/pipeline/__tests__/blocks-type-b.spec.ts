import type { BlockInput, ExecutionContext } from '@tallia/shared';

import { autoGradeBlock } from '../blocks/type-b/auto-grade';
import { sumBySubjectBlock, subjectFailCheckBlock, subjectSumBlock } from '../blocks/type-b/b-aggregate-blocks';

// 단일 과목 컨텍스트
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

// 다과목 × 다시험유형 컨텍스트 (영어 A형/B형, 수학 A형)
const multiSubjectContext: ExecutionContext = {
  evaluationType: 'B',
  config: {
    type: 'B',
    subjects: [
      {
        id: 'eng', name: '영어', questionCount: 3, maxScore: 100, failThreshold: 40,
        examTypes: [
          {
            id: 'eA', name: '영어A형', questionCount: 3, answerKey: [
              { questionNo: 1, answers: ['3'], score: 10 },
              { questionNo: 2, answers: ['1', '4'], score: 10 },
              { questionNo: 3, answers: ['2'], score: 10 },
            ],
          },
          {
            id: 'eB', name: '영어B형', questionCount: 3, answerKey: [
              { questionNo: 1, answers: ['5'], score: 10 },
              { questionNo: 2, answers: ['2'], score: 10 },
              { questionNo: 3, answers: ['4'], score: 10 },
            ],
          },
        ],
        questionErrors: [],
      },
      {
        id: 'math', name: '수학', questionCount: 2, maxScore: 100, failThreshold: 30,
        examTypes: [
          {
            id: 'mA', name: '수학A형', questionCount: 2, answerKey: [
              { questionNo: 1, answers: ['2'], score: 20 },
              { questionNo: 2, answers: ['3'], score: 20 },
            ],
          },
        ],
        questionErrors: [
          { questionNo: 2, handling: 'all_correct' }, // 수학 2번 문제 오류 → 전원 정답
        ],
      },
    ],
    totalFailThreshold: 60,
  } as never,
  defaultDecimal: { method: 'round', places: 2 },
};

function input(data: unknown, ctx = bContext): BlockInput {
  return { data, context: ctx };
}

describe('auto_grade — 단일 과목', () => {
  it('정답·복수정답·오답 채점', () => {
    const data = {
      subjects: [{
        subjectId: 'eng',
        examType: 't1',
        answers: { 1: '3', 2: '4', 3: '5' }, // Q1 정답, Q2 복수정답 중 하나, Q3 오답
      }],
    };
    const result = autoGradeBlock.execute(input(data), {});
    const scores = (result.data as { scores: { qNo: number; correct: boolean; score: number }[] }).scores;
    expect(scores).toHaveLength(3);
    expect(scores[0]).toMatchObject({ qNo: 1, correct: true, score: 10 });
    expect(scores[1]).toMatchObject({ qNo: 2, correct: true, score: 10 }); // 복수정답
    expect(scores[2]).toMatchObject({ qNo: 3, correct: false, score: 0 });
  });

  it('subjects 배열이 비어 있으면 빈 scores 반환', () => {
    const result = autoGradeBlock.execute(input({ subjects: [] }), {});
    expect((result.data as any).scores).toHaveLength(0);
  });
});

describe('auto_grade — 다과목 × 다시험유형', () => {
  it('영어A형 + 수학A형: 과목별 answerKey 각각 적용', () => {
    const data = {
      subjects: [
        { subjectId: 'eng', examType: 'eA', answers: { 1: '3', 2: '1', 3: '9' } },  // Q1,Q2 정답, Q3 오답
        { subjectId: 'math', examType: 'mA', answers: { 1: '2', 2: '9' } },          // Q1 정답, Q2 오답(but all_correct)
      ],
    };
    const result = autoGradeBlock.execute(input(data, multiSubjectContext), {});
    const scores = (result.data as { scores: { qNo: number; correct: boolean; score: number; __subjectId: string }[] }).scores;

    // 영어 3문항 + 수학 2문항 = 총 5항목
    expect(scores).toHaveLength(5);

    const engScores = scores.filter((s) => s.__subjectId === 'eng');
    const mathScores = scores.filter((s) => s.__subjectId === 'math');

    expect(engScores).toHaveLength(3);
    expect(engScores[0]).toMatchObject({ qNo: 1, correct: true, score: 10 });
    expect(engScores[1]).toMatchObject({ qNo: 2, correct: true, score: 10 }); // '1'은 영어A형 정답
    expect(engScores[2]).toMatchObject({ qNo: 3, correct: false, score: 0 });

    expect(mathScores).toHaveLength(2);
    expect(mathScores[0]).toMatchObject({ qNo: 1, correct: true, score: 20 });  // 정답
    expect(mathScores[1]).toMatchObject({ qNo: 2, correct: true, score: 20 }); // all_correct 오류 처리
  });

  it('영어B형: 다른 시험유형의 answerKey 사용', () => {
    const data = {
      subjects: [
        { subjectId: 'eng', examType: 'eB', answers: { 1: '5', 2: '2', 3: '9' } }, // Q1,Q2 정답, Q3 오답
        { subjectId: 'math', examType: 'mA', answers: { 1: '9', 2: '3' } },          // Q1 오답, Q2 all_correct
      ],
    };
    const result = autoGradeBlock.execute(input(data, multiSubjectContext), {});
    const scores = (result.data as { scores: { qNo: number; correct: boolean; score: number; __subjectId: string }[] }).scores;

    const engScores = scores.filter((s) => s.__subjectId === 'eng');
    expect(engScores[0]).toMatchObject({ qNo: 1, correct: true, score: 10 });   // 영어B형 Q1=5
    expect(engScores[1]).toMatchObject({ qNo: 2, correct: true, score: 10 });   // 영어B형 Q2=2
    expect(engScores[2]).toMatchObject({ qNo: 3, correct: false, score: 0 });

    const mathScores = scores.filter((s) => s.__subjectId === 'math');
    expect(mathScores[0]).toMatchObject({ qNo: 1, correct: false, score: 0 });  // 오답
    expect(mathScores[1]).toMatchObject({ qNo: 2, correct: true, score: 20 });  // all_correct
  });

  it('config에 없는 과목은 건너뜀', () => {
    const data = {
      subjects: [
        { subjectId: 'unknown', examType: 'x', answers: { 1: '1' } },
        { subjectId: 'eng', examType: 'eA', answers: { 1: '3', 2: '1', 3: '2' } },
      ],
    };
    const result = autoGradeBlock.execute(input(data, multiSubjectContext), {});
    const scores = (result.data as { scores: { __subjectId: string }[] }).scores;
    expect(scores.every((s) => s.__subjectId === 'eng')).toBe(true);
  });
});

describe('auto_grade — resolveScore 배점 우선순위', () => {
  const scoreCtx: ExecutionContext = {
    evaluationType: 'B',
    config: {
      type: 'B',
      subjects: [{
        id: 's1', name: '국어', questionCount: 5, maxScore: 100, failThreshold: null,
        examTypes: [{
          id: 'et1', name: '기본', questionCount: 5,
          scoreRanges: [
            { start: 1, end: 3, score: 15 },
            { start: 4, end: 5, score: 25 },
          ],
          answerKey: [
            { questionNo: 1, answers: ['1'], score: 0 },  // score=0 → 구간 배점 15
            { questionNo: 2, answers: ['2'], score: 0 },  // score=0 → 구간 배점 15
            { questionNo: 3, answers: ['3'], score: 20 }, // override 20
            { questionNo: 4, answers: ['4'], score: 0 },  // score=0 → 구간 배점 25
            { questionNo: 5, answers: ['5'], score: 0 },  // score=0 → 구간 배점 25
          ],
        }],
        questionErrors: [],
      }],
      totalFailThreshold: null,
    } as never,
    defaultDecimal: { method: 'round', places: 2 },
  };

  it('구간 배점 적용 — 모두 정답', () => {
    const data = {
      subjects: [{
        subjectId: 's1', examType: 'et1',
        answers: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' },
      }],
    };
    const result = autoGradeBlock.execute(input(data, scoreCtx), {});
    const scores = (result.data as { scores: { qNo: number; score: number }[] }).scores;
    expect(scores.find((s) => s.qNo === 1)?.score).toBe(15);  // 구간
    expect(scores.find((s) => s.qNo === 3)?.score).toBe(20);  // override
    expect(scores.find((s) => s.qNo === 4)?.score).toBe(25);  // 구간
  });

  it('override 배점 — score > 0 이면 구간보다 우선', () => {
    const data = {
      subjects: [{
        subjectId: 's1', examType: 'et1',
        answers: { 1: '9', 2: '9', 3: '3', 4: '9', 5: '9' }, // Q3만 정답
      }],
    };
    const result = autoGradeBlock.execute(input(data, scoreCtx), {});
    const scores = (result.data as { scores: { qNo: number; score: number }[] }).scores;
    expect(scores.find((s) => s.qNo === 3)?.score).toBe(20); // override 정답
    expect(scores.find((s) => s.qNo === 1)?.score).toBe(0);  // 오답 → 0
  });

  it('fallback 균등 배점 — scoreRanges 없고 score=0', () => {
    const fallbackCtx: ExecutionContext = {
      evaluationType: 'B',
      config: {
        type: 'B',
        subjects: [{
          id: 'f1', name: '수학', questionCount: 4, maxScore: 100, failThreshold: null,
          examTypes: [{
            id: 'fe1', name: '기본', questionCount: 4,
            answerKey: [
              { questionNo: 1, answers: ['1'], score: 0 },
              { questionNo: 2, answers: ['2'], score: 0 },
            ],
          }],
          questionErrors: [],
        }],
        totalFailThreshold: null,
      } as never,
      defaultDecimal: { method: 'round', places: 2 },
    };
    const data = {
      subjects: [{ subjectId: 'f1', examType: 'fe1', answers: { 1: '1', 2: '9' } }],
    };
    const result = autoGradeBlock.execute(input(data, fallbackCtx), {});
    const scores = (result.data as { scores: { qNo: number; score: number }[] }).scores;
    // fallback: 100 / 4 = 25
    expect(scores.find((s) => s.qNo === 1)?.score).toBe(25); // 정답
    expect(scores.find((s) => s.qNo === 2)?.score).toBe(0);  // 오답
  });
});

describe('sum_by_subject — __subjectId 기준 그룹핑', () => {
  it('다과목 scores를 subjectId 기준으로 집계', () => {
    const scores = {
      scores: [
        { qNo: 1, correct: true, score: 10, __subjectId: 'eng' },
        { qNo: 2, correct: true, score: 10, __subjectId: 'eng' },
        { qNo: 3, correct: false, score: 0, __subjectId: 'eng' },
        { qNo: 1, correct: true, score: 20, __subjectId: 'math' },
        { qNo: 2, correct: true, score: 20, __subjectId: 'math' },
      ],
    };
    const result = sumBySubjectBlock.execute(input(scores, multiSubjectContext), {});
    const subjects = (result.data as { subjects: { id: string; name: string; score: number }[] }).subjects;
    expect(subjects).toHaveLength(2);
    expect(subjects[0]).toMatchObject({ id: 'eng', name: '영어', score: 20 });
    expect(subjects[1]).toMatchObject({ id: 'math', name: '수학', score: 40 });
  });

  it('하위 호환: __subjectId 없으면 questionCount 슬라이스', () => {
    const scores = {
      scores: [
        { qNo: 1, correct: true, score: 10 },
        { qNo: 2, correct: true, score: 10 },
        { qNo: 3, correct: false, score: 0 },
      ],
    };
    const result = sumBySubjectBlock.execute(input(scores), {});
    const subjects = (result.data as { subjects: { name: string; score: number }[] }).subjects;
    expect(subjects[0]).toMatchObject({ name: '영어', score: 20 });
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
