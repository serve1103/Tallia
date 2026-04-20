import type { Prisma } from '@prisma/client';

export interface MappingTableEntity {
  id: string;
  tenantId: string;
  evaluationId: string;
  mappingType: string;
  columnsDef: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface MappingTableEntryEntity {
  id: string;
  mappingTableId: string;
  conditions: Prisma.JsonValue;
  score: number;
  sortOrder: number;
}

export interface MappingTableWithEntries extends MappingTableEntity {
  entries: MappingTableEntryEntity[];
}

export interface UpsertMappingEntryDto {
  conditions: Prisma.InputJsonValue;
  score: number;
  sortOrder: number;
}

export interface MappingTablesRepository {
  findByEvaluation(evaluationId: string, tenantId: string): Promise<MappingTableWithEntries | null>;
  upsertEntries(
    evaluationId: string,
    tenantId: string,
    mappingType: string,
    columnsDef: Prisma.InputJsonValue,
    entries: UpsertMappingEntryDto[],
  ): Promise<MappingTableWithEntries>;
}

export const MAPPING_TABLES_REPOSITORY = Symbol('MAPPING_TABLES_REPOSITORY');
