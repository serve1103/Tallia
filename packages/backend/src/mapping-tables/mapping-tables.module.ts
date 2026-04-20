import { Module, forwardRef } from '@nestjs/common';
import { MappingTablesController } from './controller/mapping-tables.controller';
import { MappingTablesApplication } from './application/mapping-tables.application';
import { MappingTablesService } from './service/mapping-tables.service';
import { MappingTablesPrismaRepository } from './repository-impl/mapping-tables.prisma.repository';
import { MAPPING_TABLES_REPOSITORY } from './repository/mapping-tables.repository';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { MappingTemplateGenerator } from '../excel/service/mapping-template-generator';
import { MappingUploadParser } from '../excel/service/mapping-upload-parser';

@Module({
  imports: [forwardRef(() => EvaluationsModule)],
  controllers: [MappingTablesController],
  providers: [
    MappingTablesApplication,
    MappingTablesService,
    MappingTemplateGenerator,
    MappingUploadParser,
    { provide: MAPPING_TABLES_REPOSITORY, useClass: MappingTablesPrismaRepository },
  ],
  exports: [MappingTablesService],
})
export class MappingTablesModule {}
