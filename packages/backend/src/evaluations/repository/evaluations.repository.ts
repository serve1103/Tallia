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
  deletedAt: Date | null;
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
  onlyDeleted?: boolean;
}

export interface EvaluationsRepository {
  findAll(filter: EvaluationFilter): Promise<EvaluationEntity[]>;
  findById(id: string, tenantId: string): Promise<EvaluationEntity | null>;
  /** 같은 테넌트에 같은 이름의 활성(미삭제) 평가가 존재하는지. excludeId 는 자기 자신 제외용. */
  existsByName(tenantId: string, name: string, excludeId?: string): Promise<boolean>;
  create(dto: CreateEvaluationDto): Promise<EvaluationEntity>;
  update(id: string, tenantId: string, dto: UpdateEvaluationDto): Promise<EvaluationEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  restore(id: string, tenantId: string): Promise<EvaluationEntity>;
  hardDelete(id: string, tenantId: string): Promise<void>;
  copy(id: string, tenantId: string): Promise<EvaluationEntity>;
}

export const EVALUATIONS_REPOSITORY = Symbol('EVALUATIONS_REPOSITORY');
