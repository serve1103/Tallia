import { Injectable, Inject } from '@nestjs/common';
import { MAPPING_TABLES_REPOSITORY } from '../repository/mapping-tables.repository';
import type {
  MappingTablesRepository,
  MappingTableWithEntries,
  UpsertMappingEntryDto,
} from '../repository/mapping-tables.repository';
import type { Prisma } from '@prisma/client';

@Injectable()
export class MappingTablesService {
  constructor(
    @Inject(MAPPING_TABLES_REPOSITORY) private readonly repo: MappingTablesRepository,
  ) {}

  async findByEvaluation(evaluationId: string, tenantId: string): Promise<MappingTableWithEntries | null> {
    return this.repo.findByEvaluation(evaluationId, tenantId);
  }

  async upsertEntries(
    evaluationId: string,
    tenantId: string,
    mappingType: string,
    columnsDef: Prisma.InputJsonValue,
    entries: UpsertMappingEntryDto[],
  ): Promise<MappingTableWithEntries> {
    return this.repo.upsertEntries(evaluationId, tenantId, mappingType, columnsDef, entries);
  }
}
