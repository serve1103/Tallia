import { Module } from '@nestjs/common';
import { AuditController } from './controller/audit.controller';
import { AuditService } from './service/audit.service';
import { AUDIT_REPOSITORY } from './repository/audit.repository';
import { AuditPrismaRepository } from './repository-impl/audit.prisma.repository';

@Module({
  controllers: [AuditController],
  providers: [
    AuditService,
    { provide: AUDIT_REPOSITORY, useClass: AuditPrismaRepository },
  ],
  exports: [AuditService],
})
export class AuditModule {}
