import { describe, it, expect } from 'vitest';
import { getScoreStatusTag, hasErrors } from '../score';
import type { Score } from '@tallia/shared';

const baseScore: Score = {
  id: 's1',
  tenantId: 't1',
  evaluationId: 'e1',
  uploadId: 'u1',
  examineeNo: '001',
  examineeName: '홍길동',
  rawScore: 85,
  convertedScore: 90,
  failFlag: false,
  failReasons: [],
  intermediateResults: [],
  errorFlag: false,
  errorMessage: null,
  calculatedAt: '2025-01-01T00:00:00Z',
};

describe('score models', () => {
  it('getScoreStatusTag — 정상', () => {
    const tag = getScoreStatusTag(baseScore);
    expect(tag.color).toBe('success');
    expect(tag.label).toBe('정상');
  });

  it('getScoreStatusTag — 과락', () => {
    const tag = getScoreStatusTag({ ...baseScore, failFlag: true });
    expect(tag.color).toBe('warning');
    expect(tag.label).toBe('과락');
  });

  it('getScoreStatusTag — 오류', () => {
    const tag = getScoreStatusTag({ ...baseScore, errorFlag: true });
    expect(tag.color).toBe('error');
    expect(tag.label).toBe('오류');
  });

  it('hasErrors', () => {
    expect(hasErrors(baseScore)).toBe(false);
    expect(hasErrors({ ...baseScore, errorFlag: true })).toBe(true);
  });
});
