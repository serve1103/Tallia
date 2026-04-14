import type { Score } from '@tallia/shared';

interface StatusTag {
  color: string;
  label: string;
}

export function getScoreStatusTag(score: Score): StatusTag {
  if (score.errorFlag) return { color: 'error', label: '오류' };
  if (score.failFlag) return { color: 'warning', label: '과락' };
  return { color: 'success', label: '정상' };
}

export function hasErrors(score: Score): boolean {
  return score.errorFlag;
}
