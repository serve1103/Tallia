import { create, all } from 'mathjs';
import type { BlockHandler } from '../../block-registry';
import type { BlockDefinition, BlockInput, BlockOutput } from '@tallia/shared';

const definition: BlockDefinition = {
  type: 'custom_formula',
  name: '직접 수식',
  category: 'postprocess',
  applicableTypes: ['A', 'B', 'C', 'D'],
  inputShape: 'SCALAR',
  outputShape: 'SCALAR',
  params: [{ key: 'expression', label: '수식', type: 'string', required: true }],
};

// 허용 변수/함수 화이트리스트 (04-pipeline-engine.md §4.10)
const ALLOWED_VARS = ['score', 'maxScore', 'count', 'bonus', 'weight', 'min', 'max', 'avg', 'sum'];
const ALLOWED_FUNCTIONS = ['abs', 'round', 'floor', 'ceil', 'pow', 'sqrt', 'min', 'max'];

const math = create(all, {});

function validateExpression(expression: string): void {
  const node = math.parse(expression);

  node.traverse((n) => {
    if (n.type === 'SymbolNode') {
      const name = (n as unknown as { name: string }).name;
      if (!ALLOWED_VARS.includes(name) && !ALLOWED_FUNCTIONS.includes(name)) {
        throw new Error(`허용되지 않은 변수/함수: ${name}`);
      }
    }
    if (n.type === 'FunctionAssignmentNode' || n.type === 'AccessorNode') {
      throw new Error('함수 정의와 프로퍼티 접근은 허용되지 않습니다');
    }
  });
}

export const customFormulaBlock: BlockHandler = {
  definition,
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput {
    const data = input.data as { value: number };
    const expression = params.expression as string;

    // AST 화이트리스트 검증
    validateExpression(expression);

    // 100ms 타임아웃 — 동기 실행이므로 사전 검증으로 대체
    const scope = {
      score: data.value,
      maxScore: 100,
      count: 1,
      bonus: 0,
      weight: 1,
      min: 0,
      max: 100,
      avg: data.value,
      sum: data.value,
    };

    const result = math.evaluate(expression, scope);
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error(`수식 결과가 유효한 숫자가 아닙니다: ${String(result)}`);
    }

    return { data: { value: result as number } };
  },
};
