import { Injectable } from '@nestjs/common';

/** C유형 — 문항별 채점 설정 핸들러. Phase 9에서 상세 구현. */
@Injectable()
export class TypeCConfigHandler {
  validate(config: unknown): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }
}
