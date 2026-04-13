import type { Prisma } from '@prisma/client';

export interface EvaluationEntity {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  academicYear: string | null;
  admissionType: string | null;
  config: Prisma.JsonValue;
  pipelineConfig: Prisma.JsonValue;
  defaultDecimal: Prisma.JsonValue | null;
  convertedMax: number | null;
  status: string;
  needsRecalculation: boolean;
  copiedFromId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEvaluationDto {
  tenantId: string;
  name: string;
  type: string;
  academicYear?: string;
  admissionType?: string;
  config: Prisma.InputJsonValue;
  pipelineConfig: Prisma.InputJsonValue;
  defaultDecimal?: Prisma.InputJsonValue;
  convertedMax?: number;
}

export interface UpdateEvaluationDto {
  name?: string;
  academicYear?: string;
  admissionType?: string;
  config?: Prisma.InputJsonValue;
  pipelineConfig?: Prisma.InputJsonValue;
  defaultDecimal?: Prisma.InputJsonValue;
  convertedMax?: number;
  status?: string;
  needsRecalculation?: boolean;
}

export interface EvaluationFilter {
  tenantId: string;
  academicYear?: string;
  admissionType?: string;
  type?: string;
}

export interface EvaluationsRepository {
  findAll(filter: EvaluationFilter): Promise<EvaluationEntity[]>;
  findById(id: string, tenantId: string): Promise<EvaluationEntity | null>;
  create(dto: CreateEvaluationDto): Promise<EvaluationEntity>;
  update(id: string, tenantId: string, dto: UpdateEvaluationDto): Promise<EvaluationEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  copy(id: string, tenantId: string): Promise<EvaluationEntity>;
}

export const EVALUATIONS_REPOSITORY = Symbol('EVALUATIONS_REPOSITORY');
