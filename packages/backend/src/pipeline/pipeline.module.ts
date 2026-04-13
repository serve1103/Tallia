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

    // A/B/C/D 유형별 블록은 각 Phase에서 등록
  }
}
