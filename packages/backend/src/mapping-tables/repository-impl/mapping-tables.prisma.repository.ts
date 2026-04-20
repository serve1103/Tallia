import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  MappingTablesRepository,
  MappingTableWithEntries,
  UpsertMappingEntryDto,
} from '../repository/mapping-tables.repository';
import type { Prisma } from '@prisma/client';

@Injectable()
export class MappingTablesPrismaRepository implements MappingTablesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEvaluation(evaluationId: string, tenantId: string): Promise<MappingTableWithEntries | null> {
    const table = await this.prisma.mappingTable.findFirst({
      where: { evaluationId, tenantId },
      include: { entries: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!table) return null;

    return {
      id: table.id,
      tenantId: table.tenantId,
      evaluationId: table.evaluationId,
      mappingType: table.mappingType,
      columnsDef: table.columnsDef,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
      entries: table.entries.map((e) => ({
        id: e.id,
        mappingTableId: e.mappingTableId,
        conditions: e.conditions,
        score: Number(e.score),
        sortOrder: e.sortOrder,
      })),
    };
  }

  async upsertEntries(
    evaluationId: string,
    tenantId: string,
    mappingType: string,
    columnsDef: Prisma.InputJsonValue,
    entries: UpsertMappingEntryDto[],
  ): Promise<MappingTableWithEntries> {
    const existing = await this.prisma.mappingTable.findFirst({
      where: { evaluationId, tenantId },
    });

    let tableId: string;

    if (existing) {
      await this.prisma.mappingTable.update({
        where: { id: existing.id },
        data: { mappingType, columnsDef },
      });
      tableId = existing.id;
    } else {
      const created = await this.prisma.mappingTable.create({
        data: {
          tenantId,
          evaluationId,
          mappingType,
          columnsDef,
        },
      });
      tableId = created.id;
    }

    // 기존 entries 삭제 후 재삽입 (upsert-replace 방식)
    await this.prisma.mappingTableEntry.deleteMany({ where: { mappingTableId: tableId } });

    if (entries.length > 0) {
      await this.prisma.mappingTableEntry.createMany({
        data: entries.map((e) => ({
          mappingTableId: tableId,
          conditions: e.conditions,
          score: e.score,
          sortOrder: e.sortOrder,
        })),
      });
    }

    const result = await this.prisma.mappingTable.findFirstOrThrow({
      where: { id: tableId },
      include: { entries: { orderBy: { sortOrder: 'asc' } } },
    });

    return {
      id: result.id,
      tenantId: result.tenantId,
      evaluationId: result.evaluationId,
      mappingType: result.mappingType,
      columnsDef: result.columnsDef,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      entries: result.entries.map((e) => ({
        id: e.id,
        mappingTableId: e.mappingTableId,
        conditions: e.conditions,
        score: Number(e.score),
        sortOrder: e.sortOrder,
      })),
    };
  }
}
