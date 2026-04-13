import { Injectable } from '@nestjs/common';

/** D유형 — 점수 변환표 설정 핸들러. Phase 7에서 상세 구현. */
@Injectable()
export class TypeDConfigHandler {
  validate(config: unknown): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }
}
