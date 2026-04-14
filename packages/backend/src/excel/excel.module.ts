import { Module, forwardRef } from '@nestjs/common';
import { ExcelController } from './controller/excel.controller';
import { ExcelService } from './service/excel.service';
import { ExcelApplication } from './application/excel.application';
import { TemplateGenerator } from './service/template-generator';
import { UploadParser } from './service/upload-parser';
import { ResultExporter } from './service/result-exporter';
import { ExcelPrismaRepository } from './repository-impl/excel.prisma.repository';
import { EXCEL_REPOSITORY } from './repository/excel.repository';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [forwardRef(() => EvaluationsModule)],
  controllers: [ExcelController],
  providers: [
    ExcelService,
    ExcelApplication,
    TemplateGenerator,
    UploadParser,
    ResultExporter,
    { provide: EXCEL_REPOSITORY, useClass: ExcelPrismaRepository },
  ],
  exports: [ExcelService, TemplateGenerator, UploadParser, ResultExporter],
})
export class ExcelModule {}
