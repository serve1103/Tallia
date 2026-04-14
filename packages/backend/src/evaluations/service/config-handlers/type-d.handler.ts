import { Injectable } from '@nestjs/common';
import type { TypeDConfig } from '@tallia/shared';

@Injectable()
export class TypeDConfigHandler {
  validate(config: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const c = config as TypeDConfig;

    if (!c || c.type !== 'D') {
      return { valid: false, errors: ['유효한 D유형 설정이 아닙니다'] };
    }

    if (!c.mappingType) {
      errors.push('변환표 유형이 필요합니다');
    }

    if (c.maxScore == null || c.maxScore <= 0) {
      errors.push('환산 만점은 0보다 커야 합니다');
    }

    if (!c.inputColumns || c.inputColumns.length === 0) {
      errors.push('입력 컬럼이 최소 1개 필요합니다');
    } else {
      c.inputColumns.forEach((col, idx) => {
        if (!col.key) errors.push(`컬럼 ${idx + 1}: 키가 필요합니다`);
        if (!col.label) errors.push(`컬럼 ${idx + 1}: 라벨이 필요합니다`);
      });
    }

    return { valid: errors.length === 0, errors };
  }
}
