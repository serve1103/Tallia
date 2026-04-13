import { Injectable, Inject } from '@nestjs/common';
import { AUDIT_REPOSITORY } from '../repository/audit.repository';
import type { AuditRepository, CreateAuditLogDto } from '../repository/audit.repository';

@Injectable()
export class AuditService {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly repo: AuditRepository) {}

  async log(dto: CreateAuditLogDto) {
    return this.repo.create(dto);
  }

  async findByEvaluation(evaluationId: string, tenantId: string) {
    return this.repo.findByResource('evaluation', evaluationId, tenantId);
  }

  async findByTenant(tenantId: string, page: number, limit: number) {
    return this.repo.findByTenant(tenantId, page, limit);
  }
}
