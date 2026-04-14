import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { EXCEL_REPOSITORY } from '../repository/excel.repository';
import type { ExcelRepository, CreateUploadDto } from '../repository/excel.repository';

@Injectable()
export class ExcelService {
  constructor(@Inject(EXCEL_REPOSITORY) private readonly repo: ExcelRepository) {}

  async getUploads(evaluationId: string, tenantId: string) {
    return this.repo.findUploads(evaluationId, tenantId);
  }

  async findCurrentUpload(evaluationId: string, tenantId: string) {
    const uploads = await this.repo.findUploads(evaluationId, tenantId);
    return uploads.find((u) => u.isCurrent) ?? null;
  }

  async createUpload(dto: CreateUploadDto) {
    return this.repo.createUpload(dto);
  }

  async rollback(evaluationId: string, uploadId: string, tenantId: string) {
    const upload = await this.repo.findUploadById(uploadId, tenantId);
    if (!upload) throw new NotFoundException('업로드를 찾을 수 없습니다');
    if (upload.evaluationId !== evaluationId) throw new BadRequestException('평가 ID가 일치하지 않습니다');
    await this.repo.rollback(evaluationId, uploadId, tenantId);
  }
}
