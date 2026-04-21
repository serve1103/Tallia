import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  EvaluationsRepository,
  EvaluationEntity,
  CreateEvaluationDto,
  UpdateEvaluationDto,
  EvaluationFilter,
} from '../repository/evaluations.repository';

@Injectable()
export class EvaluationsPrismaRepository implements EvaluationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: EvaluationFilter): Promise<EvaluationEntity[]> {
    return this.prisma.evaluation.findMany({
      where: {
        ...(filter.tenantId && { tenantId: filter.tenantId }),
        ...(filter.academicYear && { academicYear: filter.academicYear }),
        ...(filter.admissionType && { admissionType: filter.admissionType }),
        ...(filter.type && { type: filter.type }),
        ...(filter.onlyDeleted
          ? { deletedAt: { not: null } }
          : { deletedAt: null }),
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as EvaluationEntity[];
  }

  async findById(id: string, tenantId: string): Promise<EvaluationEntity | null> {
    return this.prisma.evaluation.findFirst({
      where: { id, tenantId, deletedAt: null },
    }) as unknown as EvaluationEntity | null;
  }

  async existsByName(tenantId: string, name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.evaluation.count({
      where: {
        tenantId,
        name,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async create(dto: CreateEvaluationDto): Promise<EvaluationEntity> {
    return this.prisma.evaluation.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        type: dto.type,
        academicYear: dto.academicYear,
        admissionType: dto.admissionType,
        config: dto.config,
        pipelineConfig: dto.pipelineConfig,
        defaultDecimal: dto.defaultDecimal,
        convertedMax: dto.convertedMax,
      },
    }) as unknown as EvaluationEntity;
  }

  async update(id: string, tenantId: string, dto: UpdateEvaluationDto): Promise<EvaluationEntity> {
    await this.prisma.evaluation.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: {
        ...dto,
      },
    });

    const updated = await this.prisma.evaluation.findFirst({
      where: { id, tenantId },
    });

    return updated as unknown as EvaluationEntity;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    // soft delete — deletedAt 설정
    await this.prisma.evaluation.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string, tenantId: string): Promise<EvaluationEntity> {
    await this.prisma.evaluation.updateMany({
      where: { id, tenantId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    const restored = await this.prisma.evaluation.findFirst({
      where: { id, tenantId },
    });

    return restored as unknown as EvaluationEntity;
  }

  async hardDelete(id: string, tenantId: string): Promise<void> {
    // 자식 레코드(FK) 먼저 삭제 후 본인 삭제. 하나의 트랜잭션으로 원자 실행.
    await this.prisma.$transaction(async (tx) => {
      await tx.score.deleteMany({ where: { evaluationId: id, tenantId } });
      await tx.scoreUpload.deleteMany({ where: { evaluationId: id, tenantId } });
      // mapping_tables → entries (cascade 가정하지 않고 명시 삭제)
      const mapping = await tx.mappingTable.findFirst({
        where: { evaluationId: id, tenantId },
      });
      if (mapping) {
        await tx.mappingTableEntry.deleteMany({ where: { mappingTableId: mapping.id } });
        await tx.mappingTable.delete({ where: { id: mapping.id } });
      }
      await tx.evaluation.deleteMany({ where: { id, tenantId } });
    });
  }

  async copy(id: string, tenantId: string): Promise<EvaluationEntity> {
    // 원본 평가 조회 (해당 테넌트 소속만, 삭제된 것 제외)
    const source = await this.prisma.evaluation.findFirstOrThrow({
      where: { id, tenantId, deletedAt: null },
      include: {
        mappingTable: {
          include: { entries: true },
        },
      },
    });

    // 이름 중복 방지: "(복사)", "(복사 2)", "(복사 3)" 순으로 증가
    const baseName = `${source.name} (복사)`;
    const copiedName = await this.resolveUniqueCopyName(baseName, tenantId);

    // 새 평가 생성 — scores/score_uploads/audit_logs는 복사하지 않음
    const copied = await this.prisma.evaluation.create({
      data: {
        tenantId: source.tenantId,
        name: copiedName,
        type: source.type,
        academicYear: source.academicYear,
        admissionType: source.admissionType,
        config: JSON.parse(JSON.stringify(source.config)),
        pipelineConfig: JSON.parse(JSON.stringify(source.pipelineConfig)),
        defaultDecimal: source.defaultDecimal != null
          ? JSON.parse(JSON.stringify(source.defaultDecimal))
          : undefined,
        convertedMax: source.convertedMax,
        status: 'draft',
        needsRecalculation: true,
        copiedFromId: source.id,
      },
    });

    // D유형: mapping_table과 entries도 함께 복사
    if (source.mappingTable) {
      const { mappingType, columnsDef, entries } = source.mappingTable;
      await this.prisma.mappingTable.create({
        data: {
          tenantId,
          evaluationId: copied.id,
          mappingType,
          columnsDef: JSON.parse(JSON.stringify(columnsDef)),
          entries: {
            create: entries.map((e) => ({
              conditions: JSON.parse(JSON.stringify(e.conditions)),
              score: e.score,
              sortOrder: e.sortOrder,
            })),
          },
        },
      });
    }

    return copied as unknown as EvaluationEntity;
  }

  /** 같은 테넌트 내에서 유니크한 복사본 이름 생성 (삭제된 평가 제외) */
  private async resolveUniqueCopyName(baseName: string, tenantId: string): Promise<string> {
    // baseName = "원본 (복사)"
    // 이미 존재하면 "원본 (복사 2)", "원본 (복사 3)" ... 으로 증가
    const stemName = baseName.replace(/ \(복사\)$/, ''); // "원본"

    // baseName과 "(복사 N)" 패턴 이름 모두 조회
    const candidates = [baseName];
    for (let n = 2; n <= 100; n++) {
      candidates.push(`${stemName} (복사 ${n})`);
    }

    const existing = await this.prisma.evaluation.findMany({
      where: {
        tenantId,
        name: { in: candidates },
        deletedAt: null,
      },
      select: { name: true },
    });

    if (existing.length === 0) return baseName;

    const takenNames = new Set(existing.map((e) => e.name));
    if (!takenNames.has(baseName)) return baseName;

    // suffix 숫자 증가
    for (let counter = 2; counter <= 100; counter++) {
      const candidate = `${stemName} (복사 ${counter})`;
      if (!takenNames.has(candidate)) return candidate;
    }

    // 100개 초과 시 타임스탬프 fallback
    return `${stemName} (복사 ${Date.now()})`;
  }
}
