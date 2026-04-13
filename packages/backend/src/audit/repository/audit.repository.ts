export interface AuditLogEntity {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: Date;
}

export interface CreateAuditLogDto {
  tenantId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress: string;
}

export interface AuditRepository {
  create(dto: CreateAuditLogDto): Promise<AuditLogEntity>;
  findByResource(resourceType: string, resourceId: string, tenantId: string): Promise<AuditLogEntity[]>;
  findByTenant(tenantId: string, page: number, limit: number): Promise<{ data: AuditLogEntity[]; total: number }>;
}

export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');
