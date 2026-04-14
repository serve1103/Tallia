import { describe, it, expect } from 'vitest';
import { formatNumber, formatScore, formatDateTime, formatDate, formatFileSize } from '../format';

describe('formatNumber', () => {
  it('null/undefined → "-"', () => {
    expect(formatNumber(null)).toBe('-');
    expect(formatNumber(undefined)).toBe('-');
  });

  it('기본 소수점 2자리', () => {
    expect(formatNumber(95.123)).toBe('95.12');
    expect(formatNumber(100)).toBe('100.00');
  });

  it('places 지정', () => {
    expect(formatNumber(95.1, 0)).toBe('95');
    expect(formatNumber(95.1, 3)).toBe('95.100');
  });
});

describe('formatScore', () => {
  it('raw만 표시', () => {
    expect(formatScore(85.5)).toBe('85.50');
  });

  it('raw / max 형태', () => {
    expect(formatScore(85.5, 100)).toBe('85.50 / 100');
  });

  it('null → "-"', () => {
    expect(formatScore(null)).toBe('-');
    expect(formatScore(null, 100)).toBe('- / 100');
  });
});

describe('formatDateTime', () => {
  it('ISO → yyyy-MM-dd HH:mm', () => {
    const result = formatDateTime('2025-03-15T14:30:00.000Z');
    // 타임존에 따라 다를 수 있으므로 형식만 확인
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('null → "-"', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime(undefined)).toBe('-');
  });
});

describe('formatDate', () => {
  it('ISO → yyyy-MM-dd', () => {
    const result = formatDate('2025-03-15T14:30:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('null → "-"', () => {
    expect(formatDate(null)).toBe('-');
  });
});

describe('formatFileSize', () => {
  it('bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('KB', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('MB', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(5242880)).toBe('5.0 MB');
  });
});
