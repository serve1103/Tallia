import { validatePipeline } from '../validators/pipeline';
import type { BlockDefinition, PipelineBlock } from '../types/pipeline';
import type { TypeAConfig } from '../types/evaluation';

// 테스트용 블록 정의
const defs: BlockDefinition[] = [
  { type: 'sum_by_committee', name: '위원별 합산', category: 'path1', applicableTypes: ['A'], inputShape: 'MATRIX', outputShape: 'ARRAY', params: [] },
  { type: 'committee_average', name: '위원 평균', category: 'path1', applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'SCALAR', params: [] },
  { type: 'average_per_item', name: '항목별 평균', category: 'path2', applicableTypes: ['A', 'C'], inputShape: 'MATRIX', outputShape: 'ARRAY', params: [] },
  { type: 'item_sum', name: '항목 합산', category: 'path2', applicableTypes: ['A'], inputShape: 'ARRAY', outputShape: 'SCALAR', params: [] },
  { type: 'normalize_to_max', name: '만점 환산', category: 'postprocess', applicableTypes: ['A', 'B', 'C', 'D'], inputShape: 'SCALAR', outputShape: 'SCALAR', params: [] },
  { type: 'apply_converted_max', name: '환산 만점', category: 'postprocess', applicableTypes: ['A', 'B', 'C', 'D'], inputShape: 'SCALAR', outputShape: 'SCALAR', params: [] },
  { type: 'grade_to_score', name: '등급→점수', category: 'preprocess', applicableTypes: ['A'], inputShape: 'GRADE_MATRIX', outputShape: 'MATRIX', params: [] },
  { type: 'auto_grade', name: '자동 채점', category: 'grading', applicableTypes: ['B'], inputShape: 'QUESTION_ANSWERS', outputShape: 'QUESTION_SCORES', params: [] },
];

const scoreConfig: TypeAConfig = { type: 'A', maxCommitteeCount: 5, dataType: 'score', items: [] };
const gradeConfig: TypeAConfig = { type: 'A', maxCommitteeCount: 5, dataType: 'grade', items: [] };

function block(type: string): PipelineBlock {
  return { type, params: {}, decimal: null };
}

describe('validatePipeline', () => {
  it('빈 블록 배열 → 에러', () => {
    const result = validatePipeline([], 'A', scoreConfig, defs);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('블록이 없습니다');
  });

  it('정상 path1 파이프라인 → valid', () => {
    const blocks = [block('sum_by_committee'), block('committee_average'), block('normalize_to_max'), block('apply_converted_max')];
    const result = validatePipeline(blocks, 'A', scoreConfig, defs);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('정상 path2 파이프라인 → valid', () => {
    const blocks = [block('average_per_item'), block('item_sum'), block('normalize_to_max'), block('apply_converted_max')];
    const result = validatePipeline(blocks, 'A', scoreConfig, defs);
    expect(result.valid).toBe(true);
  });

  it('규칙1: 다른 유형 블록 사용 → 에러', () => {
    const blocks = [block('auto_grade'), block('normalize_to_max')];
    const result = validatePipeline(blocks, 'A', scoreConfig, defs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('사용할 수 없습니다'))).toBe(true);
  });

  it('규칙2: 입출력 불일치 → 에러', () => {
    const blocks = [block('committee_average'), block('sum_by_committee'), block('normalize_to_max')];
    const result = validatePipeline(blocks, 'A', scoreConfig, defs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('입력 불일치'))).toBe(true);
  });

  it('규칙3: path1 + path2 혼용 → 에러', () => {
    const blocks = [block('sum_by_committee'), block('average_per_item'), block('normalize_to_max')];
    const result = validatePipeline(blocks, 'A', scoreConfig, defs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('동시에 사용할 수 없습니다'))).toBe(true);
  });

  it('규칙4: normalize_to_max 누락 → 에러', () => {
    const blocks = [block('sum_by_committee'), block('committee_average'), block('apply_converted_max')];
    const result = validatePipeline(blocks, 'A', scoreConfig, defs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('normalize_to_max'))).toBe(true);
  });

  it('규칙5: 등급 데이터인데 grade_to_score 없음 → 에러', () => {
    const blocks = [block('sum_by_committee'), block('committee_average'), block('normalize_to_max')];
    const result = validatePipeline(blocks, 'A', gradeConfig, defs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('grade_to_score'))).toBe(true);
  });

  it('규칙5: 등급 데이터 + grade_to_score 포함 → 규칙5 에러 없음', () => {
    const blocks = [block('grade_to_score'), block('sum_by_committee'), block('committee_average'), block('normalize_to_max')];
    const result = validatePipeline(blocks, 'A', gradeConfig, defs);
    expect(result.errors.some((e) => e.message.includes('grade_to_score'))).toBe(false);
  });

  it('규칙6: 최종 출력이 SCALAR가 아님 → 에러', () => {
    const blocks = [block('sum_by_committee'), block('normalize_to_max')];
    // sum_by_committee 출력이 ARRAY이고, normalize_to_max 입력은 SCALAR → 규칙2 에러도 발생
    const result = validatePipeline(blocks, 'A', scoreConfig, defs);
    expect(result.valid).toBe(false);
  });

  it('알 수 없는 블록 → 에러', () => {
    const blocks = [block('unknown_block'), block('normalize_to_max')];
    const result = validatePipeline(blocks, 'A', scoreConfig, defs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('알 수 없는 블록'))).toBe(true);
  });
});
