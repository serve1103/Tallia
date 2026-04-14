import type { ExecutionContext, PipelineBlock } from '@tallia/shared';
import { BlockRegistry } from '../block-registry';
import { PipelineExecutor } from '../pipeline-executor';

import { normalizeToMaxBlock } from '../blocks/common/normalize-to-max';
import { applyConvertedMaxBlock } from '../blocks/common/apply-converted-max';
import { committeeAverageBlock, committeeSumBlock, sumByCommitteeBlock } from '../blocks/type-a/path1-blocks';

describe('PipelineExecutor', () => {
  let registry: BlockRegistry;
  let executor: PipelineExecutor;

  beforeEach(() => {
    registry = new BlockRegistry();
    executor = new PipelineExecutor(registry);

    registry.register('sum_by_committee', sumByCommitteeBlock);
    registry.register('committee_average', committeeAverageBlock);
    registry.register('committee_sum', committeeSumBlock);
    registry.register('normalize_to_max', normalizeToMaxBlock);
    registry.register('apply_converted_max', applyConvertedMaxBlock);
  });

  const context: ExecutionContext = {
    evaluationType: 'A',
    config: { type: 'A', maxCommitteeCount: 3, dataType: 'score', items: [] } as never,
    defaultDecimal: { method: 'round', places: 2 },
  };

  it('순차 실행 + 중간 결과 기록', () => {
    const pipeline: PipelineBlock[] = [
      { type: 'sum_by_committee', params: {}, decimal: null },
      { type: 'committee_average', params: {}, decimal: null },
      { type: 'normalize_to_max', params: { maxScore: 100 }, decimal: null },
    ];

    const initialData = { items: ['항목1', '항목2'], data: [[80, 90], [60, 70]] };
    const result = executor.execute(pipeline, initialData, context);

    expect(result.intermediateResults).toHaveLength(3);
    expect(result.intermediateResults[0].blockType).toBe('sum_by_committee');
    expect(result.intermediateResults[1].blockType).toBe('committee_average');
    expect(result.intermediateResults[2].blockType).toBe('normalize_to_max');
    expect((result.finalData as { value: number }).value).toBeDefined();
  });

  it('소수점 처리: 블록별 설정 우선', () => {
    const pipeline: PipelineBlock[] = [
      { type: 'sum_by_committee', params: {}, decimal: null },
      { type: 'committee_average', params: {}, decimal: { method: 'floor', places: 0 } },
      { type: 'normalize_to_max', params: { maxScore: 100 }, decimal: null },
    ];

    const initialData = { items: ['항목1'], data: [[83, 77]] };
    const result = executor.execute(pipeline, initialData, context);

    // committee_average 후 floor(0) 적용: (83+77)/2 = 80.0 → floor → 80
    const avgResult = result.intermediateResults[1].output as { value: number };
    expect(avgResult.value).toBe(80);
  });

  it('등록되지 않은 블록 → 에러', () => {
    const pipeline: PipelineBlock[] = [
      { type: 'unknown_block', params: {}, decimal: null },
    ];

    expect(() => executor.execute(pipeline, {}, context)).toThrow('블록을 찾을 수 없습니다');
  });

  it('빈 파이프라인 → 빈 결과', () => {
    const result = executor.execute([], { value: 100 }, context);
    expect(result.intermediateResults).toHaveLength(0);
    expect((result.finalData as { value: number }).value).toBe(100);
  });
});
