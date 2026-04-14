import { Injectable } from '@nestjs/common';
import type { TypeCConfig } from '@tallia/shared';

@Injectable()
export class TypeCConfigHandler {
  validate(config: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const c = config as TypeCConfig;

    if (!c || c.type !== 'C') {
      return { valid: false, errors: ['유효한 C유형 설정이 아닙니다'] };
    }

    if (!c.committeeCount || c.committeeCount < 1) {
      errors.push('채점위원 수는 1 이상이어야 합니다');
    }

    if (!c.questions || c.questions.length === 0) {
      errors.push('문항이 최소 1개 필요합니다');
    } else {
      c.questions.forEach((q, idx) => {
        if (!q.name) errors.push(`문항 ${idx + 1}: 이름이 필요합니다`);
        if (q.maxScore == null || q.maxScore <= 0) errors.push(`문항 ${idx + 1}: 만점은 0보다 커야 합니다`);
      });
    }

    return { valid: errors.length === 0, errors };
  }
}
