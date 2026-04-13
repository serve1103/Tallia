import { Injectable } from '@nestjs/common';
import type {
  PipelineBlock,
  ExecutionContext,
  IntermediateResult,
  FailFlag,
  DecimalConfig,
} from '@tallia/shared';

import { BlockRegistry } from './block-registry';

export interface PipelineResult {
  finalData: unknown;
  intermediateResults: IntermediateResult[];
  failFlags: FailFlag[];
}

@Injectable()
export class PipelineExecutor {
  constructor(private readonly registry: BlockRegistry) {}

  execute(
    pipeline: PipelineBlock[],
    initialData: unknown,
    context: ExecutionContext,
  ): PipelineResult {
    const intermediateResults: IntermediateResult[] = [];
    let currentData = initialData;
    const failFlags: FailFlag[] = [];

    for (let i = 0; i < pipeline.length; i++) {
      const block = pipeline[i];
      const handler = this.registry.get(block.type);
      const output = handler.execute({ data: currentData, context }, block.params);

      // 소수점 처리: 블록별 설정 > 평가 기본값
      const decimal = block.decimal ?? context.defaultDecimal;
      currentData = this.applyDecimal(output.data, decimal);

      if (output.failFlags) failFlags.push(...output.failFlags);

      intermediateResults.push({
        blockIndex: i,
        blockType: block.type,
        label: handler.definition.name,
        output: currentData,
      });
    }

    return { finalData: currentData, intermediateResults, failFlags };
  }

  private applyDecimal(data: unknown, decimal: DecimalConfig): unknown {
    if (typeof data !== 'object' || data === null) {
      if (typeof data === 'number') {
        return this.roundValue(data, decimal);
      }
      return data;
    }

    // SCALAR: { value: number }
    if ('value' in data && typeof (data as Record<string, unknown>).value === 'number') {
      return { ...(data as Record<string, unknown>), value: this.roundValue((data as { value: number }).value, decimal) };
    }

    return data;
  }

  private roundValue(value: number, decimal: DecimalConfig): number {
    const factor = Math.pow(10, decimal.places);
    switch (decimal.method) {
      case 'round': return Math.round(value * factor) / factor;
      case 'floor': return Math.floor(value * factor) / factor;
      case 'ceil': return Math.ceil(value * factor) / factor;
    }
  }
}
