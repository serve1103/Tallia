import { describe, it, expect } from 'vitest';
import { applyDecimal, DEFAULT_DECIMAL } from '../decimal';
import type { DecimalConfig } from '@tallia/shared';

describe('applyDecimal', () => {
  it('round — 반올림', () => {
    const config: DecimalConfig = { method: 'round', places: 2 };
    expect(applyDecimal(95.125, config)).toBe(95.13);
    expect(applyDecimal(95.124, config)).toBe(95.12);
  });

  it('floor — 내림', () => {
    const config: DecimalConfig = { method: 'floor', places: 2 };
    expect(applyDecimal(95.129, config)).toBe(95.12);
    expect(applyDecimal(95.121, config)).toBe(95.12);
  });

  it('ceil — 올림', () => {
    const config: DecimalConfig = { method: 'ceil', places: 2 };
    expect(applyDecimal(95.121, config)).toBe(95.13);
    expect(applyDecimal(95.120, config)).toBe(95.12);
  });

  it('places: 0 — 정수 처리', () => {
    expect(applyDecimal(95.5, { method: 'round', places: 0 })).toBe(96);
    expect(applyDecimal(95.5, { method: 'floor', places: 0 })).toBe(95);
  });

  it('places: 3 — 소수점 3자리', () => {
    const config: DecimalConfig = { method: 'round', places: 3 };
    expect(applyDecimal(95.1235, config)).toBe(95.124);
  });
});

describe('DEFAULT_DECIMAL', () => {
  it('기본값: round, 2자리', () => {
    expect(DEFAULT_DECIMAL.method).toBe('round');
    expect(DEFAULT_DECIMAL.places).toBe(2);
  });
});
