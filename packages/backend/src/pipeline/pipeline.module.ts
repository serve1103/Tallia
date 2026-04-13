import { Module, OnModuleInit } from '@nestjs/common';
import { EvaluationsModule } from '../evaluations/evaluations.module';

import { PipelineController } from './controller/pipeline.controller';
import { BlockRegistry } from './block-registry';
import { PipelineExecutor } from './pipeline-executor';
import { PipelineValidator } from './pipeline-validator';

// 공통 블록
import { itemFailCheckBlock } from './blocks/common/item-fail-check';
import { totalFailCheckBlock } from './blocks/common/total-fail-check';
import { normalizeToMaxBlock } from './blocks/common/normalize-to-max';
import { applyConvertedMaxBlock } from './blocks/common/apply-converted-max';

// 사용자 정의 블록
import { customBonusBlock } from './blocks/custom/custom-bonus';
import { customRatioBlock } from './blocks/custom/custom-ratio';
import { customRangeMapBlock } from './blocks/custom/custom-range-map';
import { customClampBlock } from './blocks/custom/custom-clamp';
import { customFormulaBlock } from './blocks/custom/custom-formula';

// A유형 블록
import { gradeToScoreBlock } from './blocks/type-a/grade-to-score';
import {
  sumByCommitteeBlock, weightedSumByCommitteeBlock, addVirtualCommitteeBlock,
  excludeMaxCommitteeBlock, excludeMinCommitteeBlock, committeeAverageBlock, committeeSumBlock,
} from './blocks/type-a/path1-blocks';
import {
  addVirtualPerItemBlock, excludeMaxPerItemBlock, excludeMinPerItemBlock,
  averagePerItemBlock, sumPerItemBlock, applyWeightBlock,
  subToParentSumBlock, subToParentWeightedBlock, itemSumBlock, itemAverageBlock,
} from './blocks/type-a/path2-blocks';

@Module({
  imports: [EvaluationsModule],
  controllers: [PipelineController],
  providers: [BlockRegistry, PipelineExecutor, PipelineValidator],
  exports: [BlockRegistry, PipelineExecutor, PipelineValidator],
})
export class PipelineModule implements OnModuleInit {
  constructor(private readonly registry: BlockRegistry) {}

  onModuleInit() {
    // 공통 후처리 블록
    this.registry.register('item_fail_check', itemFailCheckBlock);
    this.registry.register('total_fail_check', totalFailCheckBlock);
    this.registry.register('normalize_to_max', normalizeToMaxBlock);
    this.registry.register('apply_converted_max', applyConvertedMaxBlock);

    // 사용자 정의 블록
    this.registry.register('custom_bonus', customBonusBlock);
    this.registry.register('custom_ratio', customRatioBlock);
    this.registry.register('custom_range_map', customRangeMapBlock);
    this.registry.register('custom_clamp', customClampBlock);
    this.registry.register('custom_formula', customFormulaBlock);

    // A유형 — 전처리
    this.registry.register('grade_to_score', gradeToScoreBlock);
    // A유형 — 위원 총점 방식 (path1)
    this.registry.register('sum_by_committee', sumByCommitteeBlock);
    this.registry.register('weighted_sum_by_committee', weightedSumByCommitteeBlock);
    this.registry.register('add_virtual_committee', addVirtualCommitteeBlock);
    this.registry.register('exclude_max_committee', excludeMaxCommitteeBlock);
    this.registry.register('exclude_min_committee', excludeMinCommitteeBlock);
    this.registry.register('committee_average', committeeAverageBlock);
    this.registry.register('committee_sum', committeeSumBlock);
    // A유형 — 항목별 계산 방식 (path2)
    this.registry.register('add_virtual_per_item', addVirtualPerItemBlock);
    this.registry.register('exclude_max_per_item', excludeMaxPerItemBlock);
    this.registry.register('exclude_min_per_item', excludeMinPerItemBlock);
    this.registry.register('average_per_item', averagePerItemBlock);
    this.registry.register('sum_per_item', sumPerItemBlock);
    this.registry.register('apply_weight', applyWeightBlock);
    this.registry.register('sub_to_parent_sum', subToParentSumBlock);
    this.registry.register('sub_to_parent_weighted', subToParentWeightedBlock);
    this.registry.register('item_sum', itemSumBlock);
    this.registry.register('item_average', itemAverageBlock);

    // B/C/D 유형별 블록은 각 Phase에서 등록
  }
}
