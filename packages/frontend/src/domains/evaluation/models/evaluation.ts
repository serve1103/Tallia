import type { EvaluationType, EvaluationStatus } from '@tallia/shared';

const TYPE_LABELS: Record<EvaluationType, string> = {
  A: '위원 평가',
  B: '자동 채점',
  C: '문항별 채점',
  D: '점수 변환표',
};

const STATUS_LABELS: Record<EvaluationStatus, string> = {
  draft: '초안',
  configured: '설정 완료',
  calculated: '계산 완료',
};

const STATUS_COLORS: Record<EvaluationStatus, string> = {
  draft: 'default',
  configured: 'processing',
  calculated: 'success',
};

export function getEvalTypeLabel(type: EvaluationType): string {
  return TYPE_LABELS[type];
}

export function getStatusLabel(status: EvaluationStatus): string {
  return STATUS_LABELS[status];
}

export function getStatusColor(status: EvaluationStatus): string {
  return STATUS_COLORS[status];
}

export function isConfigured(status: EvaluationStatus): boolean {
  return status !== 'draft';
}
