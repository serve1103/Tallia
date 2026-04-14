import { describe, it, expect } from 'vitest';
import {
  getEvalTypeLabel,
  getStatusLabel,
  getStatusColor,
  isConfigured,
} from '../evaluation';

describe('evaluation models', () => {
  it('getEvalTypeLabel — 유형 라벨', () => {
    expect(getEvalTypeLabel('A')).toBe('위원 평가');
    expect(getEvalTypeLabel('B')).toBe('자동 채점');
    expect(getEvalTypeLabel('C')).toBe('문항별 채점');
    expect(getEvalTypeLabel('D')).toBe('점수 변환표');
  });

  it('getStatusLabel — 상태 라벨', () => {
    expect(getStatusLabel('draft')).toBe('초안');
    expect(getStatusLabel('configured')).toBe('설정 완료');
    expect(getStatusLabel('calculated')).toBe('계산 완료');
  });

  it('getStatusColor — 상태 색상', () => {
    expect(getStatusColor('draft')).toBe('default');
    expect(getStatusColor('configured')).toBe('processing');
    expect(getStatusColor('calculated')).toBe('success');
  });

  it('isConfigured — 설정 완료 여부', () => {
    expect(isConfigured('draft')).toBe(false);
    expect(isConfigured('configured')).toBe(true);
    expect(isConfigured('calculated')).toBe(true);
  });
});
