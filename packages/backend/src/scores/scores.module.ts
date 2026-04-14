import { Module, forwardRef } from '@nestjs/common';
import { ScoresController } from './controller/scores.controller';
import { ScoresService } from './service/scores.service';
import { ScoresApplication } from './application/scores.application';
import { ScoresPrismaRepository } from './repository-impl/scores.prisma.repository';
import { SCORES_REPOSITORY } from './repository/scores.repository';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [forwardRef(() => EvaluationsModule), forwardRef(() => PipelineModule)],
  controllers: [ScoresController],
  providers: [
    ScoresService,
    ScoresApplication,
    { provide: SCORES_REPOSITORY, useClass: ScoresPrismaRepository },
  ],
  exports: [ScoresService],
})
export class ScoresModule {}
