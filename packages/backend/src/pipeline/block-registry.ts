import { Injectable } from '@nestjs/common';
import type { BlockDefinition, BlockInput, BlockOutput, EvaluationType } from '@tallia/shared';

export interface BlockHandler {
  definition: BlockDefinition;
  execute(input: BlockInput, params: Record<string, unknown>): BlockOutput;
}

@Injectable()
export class BlockRegistry {
  private blocks = new Map<string, BlockHandler>();

  register(type: string, handler: BlockHandler): void {
    this.blocks.set(type, handler);
  }

  get(type: string): BlockHandler {
    const handler = this.blocks.get(type);
    if (!handler) throw new Error(`블록을 찾을 수 없습니다: ${type}`);
    return handler;
  }

  getByType(evalType: EvaluationType): BlockDefinition[] {
    return Array.from(this.blocks.values())
      .filter((h) => h.definition.applicableTypes.includes(evalType))
      .map((h) => h.definition);
  }

  getDefinition(type: string): BlockDefinition {
    return this.get(type).definition;
  }

  getAllDefinitions(): BlockDefinition[] {
    return Array.from(this.blocks.values()).map((h) => h.definition);
  }
}
