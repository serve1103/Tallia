import { Injectable } from '@nestjs/common';

/** B유형 — 자동 채점 설정 핸들러. Phase 8에서 상세 구현. */
@Injectable()
export class TypeBConfigHandler {
  validate(config: unknown): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }
}
