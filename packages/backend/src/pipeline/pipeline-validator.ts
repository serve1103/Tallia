import { Injectable } from '@nestjs/common';
import { validatePipeline } from '@tallia/shared';
import type { PipelineBlock, EvalConfig, EvaluationType, ValidationResult } from '@tallia/shared';

import { BlockRegistry } from './block-registry';

@Injectable()
export class PipelineValidator {
  constructor(private readonly registry: BlockRegistry) {}

  validate(
    blocks: PipelineBlock[],
    evalType: EvaluationType,
    config: EvalConfig,
  ): ValidationResult {
    const definitions = this.registry.getAllDefinitions();
    return validatePipeline(blocks, evalType, config, definitions);
  }
}
