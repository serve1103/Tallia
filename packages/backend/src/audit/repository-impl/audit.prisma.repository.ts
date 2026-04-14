import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuditRepository, AuditLogEntity, CreateAuditLogDto } from '../repository/audit.repository';

@Injectable()
export class AuditPrismaRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLogEntity> {
    return this.prisma.auditLog.create({ data: dto as any }) as unknown as AuditLogEntity;
  }

  async findByResource(resourceType: string, resourceId: string, tenantId: string): Promise<AuditLogEntity[]> {
    return this.prisma.auditLog.findMany({
      where: { resourceType, resourceId, tenantId },
      orderBy: { createdAt: 'desc' },
    }) as unknown as AuditLogEntity[];
  }

  async findByTenant(tenantId: string, page: number, limit: number): Promise<{ data: AuditLogEntity[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { tenantId } }),
    ]);
    return { data: data as unknown as AuditLogEntity[], total };
  }
}
