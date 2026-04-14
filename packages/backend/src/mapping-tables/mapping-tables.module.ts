import { Module } from '@nestjs/common';
import { MappingTablesController } from './controller/mapping-tables.controller';

@Module({
  controllers: [MappingTablesController],
  providers: [],
  exports: [],
})
export class MappingTablesModule {}
