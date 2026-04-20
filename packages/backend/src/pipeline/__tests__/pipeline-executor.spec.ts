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

  describe('executeConditional: A유형 조건부 파이프라인', () => {
    const makeBlock = (type: string): import('@tallia/shared').PipelineBlock => ({
      type,
      params: {},
      decimal: null,
    });

    // 5명용: sum_by_committee → committee_average → normalize_to_max
    const pipeline5 = [makeBlock('sum_by_committee'), makeBlock('committee_average'), makeBlock('normalize_to_max')];
    // 3명용: committee_average → normalize_to_max
    const pipeline3 = [makeBlock('committee_average'), makeBlock('normalize_to_max')];
    // 2명용: committee_sum → normalize_to_max
    const pipeline2 = [makeBlock('committee_sum'), makeBlock('normalize_to_max')];

    const conditionalConfig: import('@tallia/shared').TypeAPipelineConfig = {
      conditions: [
        { committeeCount: 5, blocks: pipeline5 },
        { committeeCount: 3, blocks: pipeline3 },
        { committeeCount: 2, blocks: pipeline2 },
      ],
    };

    const aContext: import('@tallia/shared').ExecutionContext = {
      evaluationType: 'A',
      config: { type: 'A', maxCommitteeCount: 5, dataType: 'score', items: [] } as never,
      defaultDecimal: { method: 'round', places: 2 },
    };

    const initialData = { items: ['항목1'], data: [[80, 90, 85, 78, 82]] };

    it('위원 5명 → conditions[5] 블록 선택', () => {
      const result = executor.executeConditional(conditionalConfig, 5, initialData, aContext);
      expect(result.intermediateResults).toHaveLength(3);
      expect(result.intermediateResults[0].blockType).toBe('sum_by_committee');
    });

    it('위원 4명 → 가장 가까운 하위 조건 (3명) 선택', () => {
      const result = executor.executeConditional(conditionalConfig, 4, initialData, aContext);
      // 4명 → 4 >= 3 이므로 3명 파이프라인 선택
      expect(result.intermediateResults).toHaveLength(2);
      expect(result.intermediateResults[0].blockType).toBe('committee_average');
    });

    it('위원 3명 → conditions[3] 블록 선택', () => {
      const result = executor.executeConditional(conditionalConfig, 3, initialData, aContext);
      expect(result.intermediateResults).toHaveLength(2);
      expect(result.intermediateResults[0].blockType).toBe('committee_average');
    });

    it('위원 2명 → conditions[2] 블록 선택', () => {
      const data2 = { items: ['항목1'], data: [[80, 90]] };
      const result = executor.executeConditional(conditionalConfig, 2, data2, aContext);
      expect(result.intermediateResults).toHaveLength(2);
      expect(result.intermediateResults[0].blockType).toBe('committee_sum');
    });

    it('executeConfig: TypeAPipelineConfig + committeeCount → executeConditional 경로', () => {
      const result = executor.executeConfig(conditionalConfig, initialData, aContext, 5);
      expect(result.intermediateResults[0].blockType).toBe('sum_by_committee');
    });

    it('executeConfig: StandardPipelineConfig → 표준 실행 경로', () => {
      const standardConfig: import('@tallia/shared').StandardPipelineConfig = {
        blocks: [makeBlock('committee_average'), makeBlock('normalize_to_max')],
      };
      const result = executor.executeConfig(standardConfig, initialData, aContext);
      expect(result.intermediateResults).toHaveLength(2);
    });
  });
});
