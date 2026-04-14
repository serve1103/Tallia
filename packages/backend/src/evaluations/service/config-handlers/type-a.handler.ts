import { Injectable, BadRequestException } from '@nestjs/common';
import type { TypeAConfig, ItemDefinition } from '@tallia/shared';

@Injectable()
export class TypeAConfigHandler {
  validate(config: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const c = config as TypeAConfig;

    if (!c || c.type !== 'A') {
      return { valid: false, errors: ['유효한 A유형 설정이 아닙니다'] };
    }

    if (!c.maxCommitteeCount || c.maxCommitteeCount < 1) {
      errors.push('최대 위원 수는 1 이상이어야 합니다');
    }

    if (!c.dataType || !['score', 'grade'].includes(c.dataType)) {
      errors.push('입력 방식은 score 또는 grade여야 합니다');
    }

    if (!c.items || c.items.length === 0) {
      errors.push('평가 항목이 최소 1개 필요합니다');
    } else {
      c.items.forEach((item, idx) => {
        if (!item.name) errors.push(`항목 ${idx + 1}: 이름이 필요합니다`);
        if (item.maxScore == null || item.maxScore <= 0) errors.push(`항목 ${idx + 1}: 만점은 0보다 커야 합니다`);
        if (item.weight == null || item.weight <= 0) errors.push(`항목 ${idx + 1}: 가중치는 0보다 커야 합니다`);

        if (item.subItems) {
          item.subItems.forEach((sub, sidx) => {
            if (!sub.name) errors.push(`항목 ${idx + 1}-${sidx + 1}: 세부 항목 이름이 필요합니다`);
            if (sub.maxScore == null || sub.maxScore <= 0) errors.push(`항목 ${idx + 1}-${sidx + 1}: 만점은 0보다 커야 합니다`);
          });
        }

        if (c.dataType === 'grade' && item.subItems) {
          item.subItems.forEach((sub, sidx) => {
            if (!sub.gradeMapping || Object.keys(sub.gradeMapping).length === 0) {
              errors.push(`항목 ${idx + 1}-${sidx + 1}: 등급 방식에서는 등급 매핑이 필요합니다`);
            }
          });
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }
}
