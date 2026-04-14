import { Module } from '@nestjs/common';
import { ScoresController } from './controller/scores.controller';

@Module({
  controllers: [ScoresController],
  providers: [],
  exports: [],
})
export class ScoresModule {}
