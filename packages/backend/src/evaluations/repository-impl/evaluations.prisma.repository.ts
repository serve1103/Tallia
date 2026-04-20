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
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as EvaluationEntity[];
  }

  async findById(id: string, tenantId: string): Promise<EvaluationEntity | null> {
    return this.prisma.evaluation.findFirst({
      where: { id, tenantId },
    }) as unknown as EvaluationEntity | null;
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
      where: { id, tenantId },
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
    await this.prisma.evaluation.deleteMany({ where: { id, tenantId } });
  }

  async copy(id: string, tenantId: string): Promise<EvaluationEntity> {
    const source = await this.prisma.evaluation.findFirstOrThrow({
      where: { id, tenantId },
    });

    return this.prisma.evaluation.create({
      data: {
        tenantId: source.tenantId,
        name: `${source.name} (복사)`,
        type: source.type,
        academicYear: source.academicYear,
        admissionType: source.admissionType,
        config: source.config as any,
        pipelineConfig: source.pipelineConfig as any,
        defaultDecimal: source.defaultDecimal as any,
        convertedMax: source.convertedMax,
        copiedFromId: source.id,
      },
    }) as unknown as EvaluationEntity;
  }
}
