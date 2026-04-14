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
interface QuestionError { questionNo: number; handling: 'all_correct' | 'exclude' }

export const autoGradeBlock: BlockHandler = {
  definition,
  execute(input: BlockInput): BlockOutput {
    const data = input.data as { answers: { qNo: number; answer: string }[] };
    const config = input.context.config as {
      subjects: { examTypes: { answerKey?: AnswerKeyEntry[] }[]; questionErrors: QuestionError[] }[];
    };

    const answerKey = config.subjects[0]?.examTypes[0]?.answerKey ?? [];
    const errors = config.subjects[0]?.questionErrors ?? [];

    const scores = data.answers.map((qa) => {
      const key = answerKey.find((k) => k.questionNo === qa.qNo);
      if (!key) return { qNo: qa.qNo, correct: false, score: 0 };

      const error = errors.find((e) => e.questionNo === qa.qNo);
      if (error?.handling === 'all_correct') {
        return { qNo: qa.qNo, correct: true, score: key.score };
      }
      if (error?.handling === 'exclude') {
        return { qNo: qa.qNo, correct: false, score: 0 };
      }

      // 복수정답: answers 배열 중 하나라도 일치하면 정답
      const correct = key.answers.includes(qa.answer);
      return { qNo: qa.qNo, correct, score: correct ? key.score : 0 };
    });

    return { data: { scores } };
  },
};
