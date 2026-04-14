import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput, FailFlag } from '@tallia/shared';

// sub_question_sum
const subQuestionSumDef: BlockDefinition = {
  type: 'sub_question_sum', name: '소문항 합산→대문항', category: 'aggregate',
  applicableTypes: ['C'], inputShape: 'QUESTION_ITEM_SCORES', outputShape: 'QUESTION_ITEM_SCORES', params: [],
};

export const subQuestionSumBlock: BlockHandler = {
  definition: subQuestionSumDef,
  execute(input: BlockInput): BlockOutput {
    const { items, data } = input.data as { items: string[]; data: number[] };
    const config = input.context.config as { questions: { name: string; subQuestions?: unknown[] }[] };
    const result: { items: string[]; data: number[] } = { items: [], data: [] };
    let idx = 0;
    for (const q of config.questions) {
      const subCount = q.subQuestions?.length ?? 1;
      const sum = data.slice(idx, idx + subCount).reduce((s, v) => s + v, 0);
      result.items.push(q.name);
      result.data.push(sum);
      idx += subCount;
    }
    return { data: result };
  },
};

// sub_question_weighted_sum
const subQuestionWeightedSumDef: BlockDefinition = {
  type: 'sub_question_weighted_sum', name: '소문항 가중합산→대문항', category: 'aggregate',
  applicableTypes: ['C'], inputShape: 'QUESTION_ITEM_SCORES', outputShape: 'QUESTION_ITEM_SCORES', params: [],
};

export const subQuestionWeightedSumBlock: BlockHandler = {
  definition: subQuestionWeightedSumDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { items: string[]; data: number[] };
    const config = input.context.config as { questions: { name: string; weight: number; subQuestions?: { weight: number }[] }[] };
    const result: { items: string[]; data: number[] } = { items: [], data: [] };
    let idx = 0;
    for (const q of config.questions) {
      const subs = q.subQuestions ?? [{ weight: 1 }];
      let sum = 0;
      for (const sub of subs) { sum += (data[idx++] ?? 0) * (sub.weight ?? 1); }
      result.items.push(q.name);
      result.data.push(sum);
    }
    return { data: result };
  },
};

// question_weight
const questionWeightDef: BlockDefinition = {
  type: 'question_weight', name: '문항 가중치 적용', category: 'aggregate',
  applicableTypes: ['C'], inputShape: 'QUESTION_ITEM_SCORES', outputShape: 'QUESTION_ITEM_SCORES', params: [],
};

export const questionWeightBlock: BlockHandler = {
  definition: questionWeightDef,
  execute(input: BlockInput): BlockOutput {
    const { items, data } = input.data as { items: string[]; data: number[] };
    const config = input.context.config as { questions: { weight: number }[] };
    const weighted = data.map((v, i) => v * (config.questions[i]?.weight ?? 1));
    return { data: { items, data: weighted } };
  },
};

// question_sum
const questionSumDef: BlockDefinition = {
  type: 'question_sum', name: '문항 합산', category: 'aggregate',
  applicableTypes: ['C'], inputShape: 'QUESTION_ITEM_SCORES', outputShape: 'SCALAR', params: [],
};

export const questionSumBlock: BlockHandler = {
  definition: questionSumDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { data: number[] };
    return { data: { value: data.reduce((s, v) => s + v, 0) } };
  },
};

// question_weighted_sum
const questionWeightedSumDef: BlockDefinition = {
  type: 'question_weighted_sum', name: '문항 가중합산', category: 'aggregate',
  applicableTypes: ['C'], inputShape: 'QUESTION_ITEM_SCORES', outputShape: 'SCALAR', params: [],
};

export const questionWeightedSumBlock: BlockHandler = {
  definition: questionWeightedSumDef,
  execute(input: BlockInput): BlockOutput {
    const { data } = input.data as { data: number[] };
    const config = input.context.config as { questions: { weight: number }[] };
    const sum = data.reduce((s, v, i) => s + v * (config.questions[i]?.weight ?? 1), 0);
    return { data: { value: sum } };
  },
};

// sub_question_fail_check
const subQuestionFailCheckDef: BlockDefinition = {
  type: 'sub_question_fail_check', name: '소문항별 과락 판정', category: 'aggregate',
  applicableTypes: ['C'], inputShape: 'QUESTION_ITEM_SCORES', outputShape: 'QUESTION_ITEM_SCORES', params: [],
};

export const subQuestionFailCheckBlock: BlockHandler = {
  definition: subQuestionFailCheckDef,
  execute(input: BlockInput): BlockOutput {
    const data = input.data as { items: string[]; data: number[] };
    const failFlags: FailFlag[] = [];
    // 과락 판정은 config에서 failThreshold 읽어 처리
    return { data, failFlags };
  },
};

// question_fail_check
const questionFailCheckDef: BlockDefinition = {
  type: 'question_fail_check', name: '대문항별 과락 판정', category: 'aggregate',
  applicableTypes: ['C'], inputShape: 'QUESTION_ITEM_SCORES', outputShape: 'QUESTION_ITEM_SCORES', params: [],
};

export const questionFailCheckBlock: BlockHandler = {
  definition: questionFailCheckDef,
  execute(input: BlockInput): BlockOutput {
    const data = input.data as { items: string[]; data: number[] };
    const config = input.context.config as { questions: { name: string; failThreshold: number | null }[] };
    const failFlags: FailFlag[] = [];
    data.data.forEach((val, i) => {
      const threshold = config.questions[i]?.failThreshold;
      if (threshold !== null && threshold !== undefined && val < threshold) {
        failFlags.push({ type: 'item', name: config.questions[i].name, value: val, threshold });
      }
    });
    return { data, failFlags };
  },
};
