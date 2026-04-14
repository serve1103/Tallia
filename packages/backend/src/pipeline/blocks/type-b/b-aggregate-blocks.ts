import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput, FailFlag } from '@tallia/shared';

// sum_by_subject
const sumBySubjectDef: BlockDefinition = {
  type: 'sum_by_subject', name: '과목별 합산', category: 'aggregate',
  applicableTypes: ['B'], inputShape: 'QUESTION_SCORES', outputShape: 'SUBJECT_SCORES', params: [],
};

export const sumBySubjectBlock: BlockHandler = {
  definition: sumBySubjectDef,
  execute(input: BlockInput): BlockOutput {
    const data = input.data as { scores: { qNo: number; correct: boolean; score: number }[] };
    const config = input.context.config as { subjects: { id: string; name: string; questionCount: number }[] };
    let idx = 0;
    const subjects = config.subjects.map((subj) => {
      const slice = data.scores.slice(idx, idx + subj.questionCount);
      idx += subj.questionCount;
      const score = slice.reduce((s, q) => s + q.score, 0);
      return { id: subj.id, name: subj.name, score };
    });
    return { data: { subjects } };
  },
};

// subject_fail_check
const subjectFailCheckDef: BlockDefinition = {
  type: 'subject_fail_check', name: '과목별 과락 판정', category: 'aggregate',
  applicableTypes: ['B'], inputShape: 'SUBJECT_SCORES', outputShape: 'SUBJECT_SCORES', params: [],
};

export const subjectFailCheckBlock: BlockHandler = {
  definition: subjectFailCheckDef,
  execute(input: BlockInput): BlockOutput {
    const data = input.data as { subjects: { id: string; name: string; score: number }[] };
    const config = input.context.config as { subjects: { id: string; failThreshold: number | null }[] };
    const failFlags: FailFlag[] = [];
    for (const subj of data.subjects) {
      const cfg = config.subjects.find((s) => s.id === subj.id);
      if (cfg?.failThreshold && subj.score < cfg.failThreshold) {
        failFlags.push({ type: 'item', name: subj.name, value: subj.score, threshold: cfg.failThreshold });
      }
    }
    return { data, failFlags };
  },
};

// subject_sum
const subjectSumDef: BlockDefinition = {
  type: 'subject_sum', name: '과목 합산', category: 'aggregate',
  applicableTypes: ['B'], inputShape: 'SUBJECT_SCORES', outputShape: 'SCALAR', params: [],
};

export const subjectSumBlock: BlockHandler = {
  definition: subjectSumDef,
  execute(input: BlockInput): BlockOutput {
    const data = input.data as { subjects: { score: number }[] };
    return { data: { value: data.subjects.reduce((s, sub) => s + sub.score, 0) } };
  },
};

// subject_weighted_sum
const subjectWeightedSumDef: BlockDefinition = {
  type: 'subject_weighted_sum', name: '과목 가중합산', category: 'aggregate',
  applicableTypes: ['B'], inputShape: 'SUBJECT_SCORES', outputShape: 'SCALAR', params: [],
};

export const subjectWeightedSumBlock: BlockHandler = {
  definition: subjectWeightedSumDef,
  execute(input: BlockInput): BlockOutput {
    const data = input.data as { subjects: { id: string; score: number }[] };
    // 가중치는 config에서 — 현재 기본 1.0
    return { data: { value: data.subjects.reduce((s, sub) => s + sub.score, 0) } };
  },
};
