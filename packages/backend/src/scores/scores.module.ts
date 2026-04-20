import { Module, forwardRef } from '@nestjs/common';
import { ScoresController } from './controller/scores.controller';
import { ScoresService } from './service/scores.service';
import { ScoresApplication } from './application/scores.application';
import { ScoresPrismaRepository } from './repository-impl/scores.prisma.repository';
import { SCORES_REPOSITORY } from './repository/scores.repository';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { ExcelModule } from '../excel/excel.module';
import { AuditModule } from '../audit/audit.module';
import { MappingTablesModule } from '../mapping-tables/mapping-tables.module';

@Module({
  imports: [
    forwardRef(() => EvaluationsModule),
    forwardRef(() => PipelineModule),
    forwardRef(() => ExcelModule),
    forwardRef(() => AuditModule),
    forwardRef(() => MappingTablesModule),
  ],
  controllers: [ScoresController],
  providers: [
    ScoresService,
    ScoresApplication,
    { provide: SCORES_REPOSITORY, useClass: ScoresPrismaRepository },
  ],
  exports: [ScoresService],
})
export class ScoresModule {}
