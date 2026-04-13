import { Module } from '@nestjs/common';
import { TenantsController } from './controller/tenants.controller';
import { TenantsApplication } from './application/tenants.application';
import { TenantsService } from './service/tenants.service';
import { TENANTS_REPOSITORY } from './repository/tenants.repository';
import { TenantsPrismaRepository } from './repository-impl/tenants.prisma.repository';

@Module({
  controllers: [TenantsController],
  providers: [
    TenantsApplication,
    TenantsService,
    {
      provide: TENANTS_REPOSITORY,
      useClass: TenantsPrismaRepository,
    },
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
