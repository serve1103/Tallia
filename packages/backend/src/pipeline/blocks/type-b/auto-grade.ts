import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'auto_grade',
  name: '자동 채점',
  category: 'grading',
  applicableTypes: ['B'],
  inputShape: 'QUESTION_ANSWERS',
  outputShape: 'QUESTION_SCORES',
  params: [],
};

interface AnswerKeyEntry { questionNo: number; answers: string[]; score: number }
interface ScoreRange { start: number; end: number; score: number }
interface QuestionError { questionNo: number; handling: 'all_correct' | 'exclude' }
interface ExamTypeDef { id: string; answerKey?: AnswerKeyEntry[]; scoreRanges?: ScoreRange[] }
interface SubjectDef { id: string; questionCount?: number; maxScore?: number; examTypes: ExamTypeDef[]; questionErrors: QuestionError[] }

/**
 * 배점 결정 우선순위:
 * 1. key.score > 0 → 개별 override
 * 2. examType.scoreRanges 에서 qNo 가 속한 구간 → 구간 배점
 * 3. fallback: subject.maxScore / subject.questionCount → 균등 분배
 */
function resolveScore(
  qNo: number,
  key: AnswerKeyEntry,
  examType: ExamTypeDef,
  subject: SubjectDef,
): number {
  if (key.score > 0) return key.score;
  const range = examType.scoreRanges?.find((r) => qNo >= r.start && qNo <= r.end);
  if (range) return range.score;
  const qc = subject.questionCount ?? 1;
  return qc > 0 ? Math.round((( subject.maxScore ?? 0) / qc) * 100) / 100 : 0;
}

/** B유형 블록 입력: 과목별 답안 배열 */
interface SubjectAnswerInput {
  subjectId: string;
  examType: string;
  /** qNo → 응답 문자열 */
  answers: Record<number, string>;
}

/**
 * 채점 결과 항목. subject별로 순서대로 flatten.
 * sum_by_subject 가 subject 순서로 슬라이스할 수 있도록 __subjectId 를 함께 저장.
 */
interface ScoreItem {
  qNo: number;
  correct: boolean;
  score: number;
  __subjectId: string;
}

export const autoGradeBlock: BlockHandler = {
  definition,
  execute(input: BlockInput): BlockOutput {
    const config = input.context.config as { subjects: SubjectDef[] };

    // 다과목 형식 { subjects: SubjectAnswerInput[] } 지원
    const raw = input.data as { subjects?: SubjectAnswerInput[] };

    if (!raw.subjects || raw.subjects.length === 0) {
      // 비어 있으면 빈 결과 반환
      return { data: { scores: [] } };
    }

    const allScores: ScoreItem[] = [];

    for (const subjectInput of raw.subjects) {
      // config에서 해당 과목 찾기
      const subjectConfig = config.subjects.find((s) => s.id === subjectInput.subjectId);
      if (!subjectConfig) {
        // 설정에 없는 과목은 건너뜀
        continue;
      }

      // 수험자가 선택한 시험유형의 정답키 조회
      const examTypeDef = subjectConfig.examTypes.find((et) => et.id === subjectInput.examType);
      const answerKey: AnswerKeyEntry[] = examTypeDef?.answerKey ?? [];
      const questionErrors = subjectConfig.questionErrors ?? [];

      // answers는 { [qNo]: answer } 형태 — answerKey 길이 기준으로 채점
      const qNos = answerKey.map((k) => k.questionNo);

      for (const key of answerKey) {
        const studentAnswer = String(subjectInput.answers[key.questionNo] ?? '').trim();

        const error = questionErrors.find((e) => e.questionNo === key.questionNo);
        if (error?.handling === 'all_correct') {
          allScores.push({ qNo: key.questionNo, correct: true, score: resolveScore(key.questionNo, key, examTypeDef ?? { id: '' }, subjectConfig), __subjectId: subjectInput.subjectId });
          continue;
        }
        if (error?.handling === 'exclude') {
          allScores.push({ qNo: key.questionNo, correct: false, score: 0, __subjectId: subjectInput.subjectId });
          continue;
        }

        // 복수정답: answers 배열 중 하나라도 일치하면 정답
        const correct = key.answers.includes(studentAnswer);
        const resolvedScore = resolveScore(key.questionNo, key, examTypeDef ?? { id: '' }, subjectConfig);
        allScores.push({ qNo: key.questionNo, correct, score: correct ? resolvedScore : 0, __subjectId: subjectInput.subjectId });
      }

      // answerKey에 없는 문항(수험자가 응답했지만 키 없음)은 0점 처리
      for (const [qNoStr] of Object.entries(subjectInput.answers)) {
        const qNo = Number(qNoStr);
        if (!qNos.includes(qNo)) {
          allScores.push({ qNo, correct: false, score: 0, __subjectId: subjectInput.subjectId });
        }
      }
    }

    return { data: { scores: allScores } };
  },
};
