type JsonValue = unknown;

export interface ScoreUploadEntity {
  id: string;
  tenantId: string;
  evaluationId: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  status: string;
  isCurrent: boolean;
  rawData: JsonValue;
  validationErrors: JsonValue;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface CreateUploadDto {
  tenantId: string;
  evaluationId: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  rawData: JsonValue;
  validationErrors: JsonValue;
  uploadedBy: string;
}

export interface ExcelRepository {
  findUploads(evaluationId: string, tenantId: string): Promise<ScoreUploadEntity[]>;
  findUploadById(id: string, tenantId: string): Promise<ScoreUploadEntity | null>;
  createUpload(dto: CreateUploadDto): Promise<ScoreUploadEntity>;
  rollback(evaluationId: string, uploadId: string, tenantId: string): Promise<void>;
}

export const EXCEL_REPOSITORY = Symbol('EXCEL_REPOSITORY');
