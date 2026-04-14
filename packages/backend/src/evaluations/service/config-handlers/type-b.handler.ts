import { Injectable } from '@nestjs/common';
import type { TypeBConfig } from '@tallia/shared';

@Injectable()
export class TypeBConfigHandler {
  validate(config: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const c = config as TypeBConfig;

    if (!c || c.type !== 'B') {
      return { valid: false, errors: ['유효한 B유형 설정이 아닙니다'] };
    }

    if (!c.subjects || c.subjects.length === 0) {
      errors.push('과목이 최소 1개 필요합니다');
    } else {
      c.subjects.forEach((subj, idx) => {
        if (!subj.name) errors.push(`과목 ${idx + 1}: 이름이 필요합니다`);
        if (!subj.questionCount || subj.questionCount < 1) errors.push(`과목 ${idx + 1}: 문항 수는 1 이상이어야 합니다`);
        if (subj.maxScore == null || subj.maxScore <= 0) errors.push(`과목 ${idx + 1}: 만점은 0보다 커야 합니다`);
      });
    }

    return { valid: errors.length === 0, errors };
  }
}
