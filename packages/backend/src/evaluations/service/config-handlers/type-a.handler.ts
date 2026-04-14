import { Injectable } from '@nestjs/common';

/** A유형 — 위원 평가 설정 핸들러. Phase 6에서 상세 구현. */
@Injectable()
export class TypeAConfigHandler {
  validate(config: unknown): { valid: boolean; errors: string[] } {
    // Phase 6에서 상세 유효성 검증 구현
    return { valid: true, errors: [] };
  }
}
