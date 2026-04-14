import type { DecimalConfig } from '@tallia/shared';

/** DecimalConfig에 따라 소수점 처리 */
export function applyDecimal(value: number, config: DecimalConfig): number {
  const factor = Math.pow(10, config.places);
  switch (config.method) {
    case 'round':
      return Math.round(value * factor) / factor;
    case 'floor':
      return Math.floor(value * factor) / factor;
    case 'ceil':
      return Math.ceil(value * factor) / factor;
  }
}

/** 기본 소수점 설정 */
export const DEFAULT_DECIMAL: DecimalConfig = {
  method: 'round',
  places: 2,
};
