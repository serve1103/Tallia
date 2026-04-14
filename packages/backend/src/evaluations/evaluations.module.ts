import { Module } from '@nestjs/common';
import { EvaluationsController } from './controller/evaluations.controller';
import { EvaluationsApplication } from './application/evaluations.application';
import { EvaluationsService } from './service/evaluations.service';
import { EVALUATIONS_REPOSITORY } from './repository/evaluations.repository';
import { EvaluationsPrismaRepository } from './repository-impl/evaluations.prisma.repository';
import { TypeAConfigHandler } from './service/config-handlers/type-a.handler';
import { TypeBConfigHandler } from './service/config-handlers/type-b.handler';
import { TypeCConfigHandler } from './service/config-handlers/type-c.handler';
import { TypeDConfigHandler } from './service/config-handlers/type-d.handler';

@Module({
  controllers: [EvaluationsController],
  providers: [
    EvaluationsApplication,
    EvaluationsService,
    {
      provide: EVALUATIONS_REPOSITORY,
      useClass: EvaluationsPrismaRepository,
    },
    TypeAConfigHandler,
    TypeBConfigHandler,
    TypeCConfigHandler,
    TypeDConfigHandler,
  ],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
