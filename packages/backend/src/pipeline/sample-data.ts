import type { EvalConfig } from '@tallia/shared';

/**
 * EvalConfig에서 실제 항목/문항 이름을 추출해 유형별 샘플 입력 데이터를 생성.
 * 점수 범위: 50~90 사이 임의값.
 */
export function getSampleInput(config: EvalConfig): unknown {
  switch (config.type) {
    case 'A':
      return buildTypeASample(config);
    case 'B':
      return buildTypeBSample(config);
    case 'C':
      return buildTypeCSample(config);
    case 'D':
      return buildTypeDSample(config);
  }
}

function randScore(min = 50, max = 90): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildTypeASample(config: Extract<EvalConfig, { type: 'A' }>): unknown {
  const items = config.items.map((item) => item.name);
  // 위원 수: 기본 3명
  const committeeCount = Math.min(config.maxCommitteeCount, 3);

  if (config.dataType === 'grade') {
    // GRADE_MATRIX: { items, data: string[][] }
    const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C'];
    const data = items.map(() =>
      Array.from({ length: committeeCount }, () => grades[Math.floor(Math.random() * grades.length)]),
    );
    return { items, data };
  }

  // MATRIX: { items, data: number[][] }
  const data = items.map((_, idx) => {
    const maxScore = config.items[idx]?.maxScore ?? 100;
    const base = Math.min(maxScore, 90);
    const low = Math.min(maxScore, 50);
    return Array.from({ length: committeeCount }, () => randScore(low, base));
  });
  return { items, data };
}

function buildTypeBSample(config: Extract<EvalConfig, { type: 'B' }>): unknown {
  if (config.subjects.length === 0) {
    // 설정된 과목이 없는 경우 최소 샘플
    return { subjects: [{ subjectId: 's1', examType: 'A', answers: { 1: '3', 2: '1', 3: '4' } }] };
  }

  // 다과목: 모든 과목에 대해 첫 번째 시험유형으로 샘플 생성
  const subjects = config.subjects.map((subject) => {
    const examType = subject.examTypes[0]?.id ?? 'A';
    const answerKey = subject.examTypes[0]?.answerKey;
    // answerKey가 있으면 그 문항 번호 기준, 없으면 questionCount 기준
    const qNos = answerKey
      ? answerKey.map((k) => k.questionNo)
      : Array.from({ length: Math.min(subject.questionCount, 5) }, (_, i) => i + 1);

    const answers: Record<number, string> = {};
    for (const qNo of qNos) {
      answers[qNo] = String(Math.floor(Math.random() * 5) + 1);
    }
    return { subjectId: subject.id, examType, answers };
  });

  return { subjects };
}

function buildTypeCSample(config: Extract<EvalConfig, { type: 'C' }>): unknown {
  const questions: Record<string, number> = {};
  for (const q of config.questions) {
    if (q.subQuestions && q.subQuestions.length > 0) {
      for (const sq of q.subQuestions) {
        const max = sq.maxScore;
        questions[`${q.id}-${sq.id}`] = randScore(Math.floor(max * 0.5), max);
      }
    } else {
      questions[q.id] = randScore(Math.floor(q.maxScore * 0.5), q.maxScore);
    }
  }
  return { questions };
}

function buildTypeDSample(config: Extract<EvalConfig, { type: 'D' }>): unknown {
  const conditions: Record<string, string | number> = {};
  for (const col of config.inputColumns) {
    if (col.type === 'number') {
      conditions[col.key] = randScore(50, 900);
    } else {
      conditions[col.key] = 'A';
    }
  }
  return { conditions };
}
