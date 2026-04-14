import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'grade_to_score',
  name: '등급→점수 변환',
  category: 'preprocess',
  applicableTypes: ['A'],
  inputShape: 'GRADE_MATRIX',
  outputShape: 'MATRIX',
  params: [],
};

export const gradeToScoreBlock: BlockHandler = {
  definition,
  execute(input: BlockInput): BlockOutput {
    const data = input.data as { items: string[]; data: string[][] };
    const config = input.context.config as { items: { subItems?: { gradeMapping?: Record<string, number> }[] }[] };

    const converted: number[][] = data.data.map((row) =>
      row.map((grade, colIdx) => {
        const item = config.items[colIdx];
        const mapping = item?.subItems?.[0]?.gradeMapping ?? {};
        return mapping[grade] ?? 0;
      }),
    );

    return { data: { items: data.items, data: converted } };
  },
};
