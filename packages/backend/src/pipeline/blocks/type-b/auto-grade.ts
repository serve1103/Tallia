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
interface ExamTypeDef { id: string; name?: string; answerKey?: AnswerKeyEntry[]; scoreRanges?: ScoreRange[] }
interface SubjectDef {
  id: string;
  questionCount?: number;
  maxScore?: number;
  examTypes: ExamTypeDef[];
  questionErrors: QuestionError[];
  /** 레거시: examTypes 이전 버전에서 subject 레벨에 저장된 정답지/구간 배점 */
  answerKey?: AnswerKeyEntry[];
  scoreRanges?: ScoreRange[];
}

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
  /** 출제 오류 처리가 적용된 문항임을 표시. UI 에서 배지로 노출. */
  errorHandling?: 'all_correct' | 'exclude';
}

export const autoGradeBlock: BlockHandler = {
  definition,
  execute(input: BlockInput): BlockOutput {
    const config = input.context.config as { subjects: SubjectDef[] };

    // 다과목 형식 { subjects: SubjectAnswerInput[] } 지원
    const raw = input.data as { subjects?: SubjectAnswerInput[] };

    if (!raw.subjects || raw.subjects.length === 0) {
      // rawData 가 구 포맷(평면 { Q1,Q2,... })으로 저장된 경우 subjects 키가 없어서 여기에 빠짐.
      // 조용히 0점 처리하면 원인 추적이 어려우므로 명확한 오류로 재업로드 유도.
      throw new Error(
        '업로드 데이터에 과목/답안 구조(subjects)가 없습니다. B유형 파서가 적용되기 전에 업로드된 파일일 수 있으니 엑셀을 다시 업로드해주세요.',
      );
    }

    const allScores: ScoreItem[] = [];

    for (const subjectInput of raw.subjects) {
      // config에서 해당 과목 찾기
      const subjectConfig = config.subjects.find((s) => s.id === subjectInput.subjectId);
      if (!subjectConfig) {
        // 설정에 없는 과목은 건너뜀
        continue;
      }

      // 수험자가 선택한 시험유형의 정답키 조회.
      // parseTypeB 는 examType 에 유형 name(예: "기본","A형")을 넣고,
      // saveAnswerKey 는 id 또는 name 중 아무거나로 저장할 수 있으므로 둘 다 매칭.
      // 매칭 실패 시 examTypes 가 1개뿐이면 그 유형을 기본으로 사용.
      let examTypeDef = (subjectConfig.examTypes ?? []).find(
        (et) => et.id === subjectInput.examType || et.name === subjectInput.examType,
      );
      if (!examTypeDef && (subjectConfig.examTypes ?? []).length === 1) {
        examTypeDef = subjectConfig.examTypes[0];
      }
      // 레거시(examTypes 이전 버전)로 subject 레벨에 저장된 answerKey/scoreRanges 도 fallback 으로 인정
      const answerKey: AnswerKeyEntry[] =
        examTypeDef?.answerKey ?? subjectConfig.answerKey ?? [];
      const effectiveExamType: ExamTypeDef = examTypeDef ?? {
        id: '',
        scoreRanges: subjectConfig.scoreRanges,
      };
      if (answerKey.length === 0) {
        throw new Error(
          `정답지 없음: 과목 "${subjectConfig.id}" / 유형 "${subjectInput.examType}"에 저장된 정답지를 찾지 못했습니다. 평가 설정에서 해당 시험유형의 정답지를 저장한 뒤 다시 계산해주세요.`,
        );
      }
      const questionErrors = subjectConfig.questionErrors ?? [];

      // answers는 { [qNo]: answer } 형태 — answerKey 길이 기준으로 채점
      const qNos = answerKey.map((k) => k.questionNo);

      for (const key of answerKey) {
        const studentAnswer = String(subjectInput.answers[key.questionNo] ?? '').trim();

        const error = questionErrors.find((e) => e.questionNo === key.questionNo);
        if (error?.handling === 'all_correct') {
          allScores.push({
            qNo: key.questionNo,
            correct: true,
            score: resolveScore(key.questionNo, key, effectiveExamType, subjectConfig),
            __subjectId: subjectInput.subjectId,
            errorHandling: 'all_correct',
          });
          continue;
        }
        if (error?.handling === 'exclude') {
          allScores.push({
            qNo: key.questionNo,
            correct: false,
            score: 0,
            __subjectId: subjectInput.subjectId,
            errorHandling: 'exclude',
          });
          continue;
        }

        // 복수정답: answers 배열 중 하나라도 일치하면 정답
        const correct = key.answers.includes(studentAnswer);
        const resolvedScore = resolveScore(key.questionNo, key, effectiveExamType, subjectConfig);
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
