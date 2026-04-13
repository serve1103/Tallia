export const AUDIT_ACTIONS = [
  'data_view',
  'data_modify',
  'data_download',
  'config_change',
  'calculate',
  'upload',
  'rollback',
  'grade_verify',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  /** PII 값 기록 금지 — 필드명만 기록 */
  details: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}
