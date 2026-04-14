import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ExcelRepository, ScoreUploadEntity, CreateUploadDto } from '../repository/excel.repository';

@Injectable()
export class ExcelPrismaRepository implements ExcelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUploads(evaluationId: string, tenantId: string): Promise<ScoreUploadEntity[]> {
    const uploads = await this.prisma.scoreUpload.findMany({
      where: { evaluationId, tenantId },
      orderBy: { uploadedAt: 'desc' },
    });
    return uploads as unknown as ScoreUploadEntity[];
  }

  async findUploadById(id: string, tenantId: string): Promise<ScoreUploadEntity | null> {
    const upload = await this.prisma.scoreUpload.findFirst({
      where: { id, tenantId },
    });
    return upload as unknown as ScoreUploadEntity | null;
  }

  async createUpload(dto: CreateUploadDto): Promise<ScoreUploadEntity> {
    // 기존 active 업로드 비활성화
    await this.prisma.scoreUpload.updateMany({
      where: { evaluationId: dto.evaluationId, tenantId: dto.tenantId, isCurrent: true },
      data: { isCurrent: false, status: 'rolled_back' },
    });

    const upload = await this.prisma.scoreUpload.create({
      data: {
        tenantId: dto.tenantId,
        evaluationId: dto.evaluationId,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        rowCount: dto.rowCount,
        rawData: dto.rawData as any,
        validationErrors: dto.validationErrors as any,
        uploadedBy: dto.uploadedBy,
        status: 'active',
        isCurrent: true,
      },
    });

    return upload as unknown as ScoreUploadEntity;
  }

  async rollback(evaluationId: string, uploadId: string, tenantId: string): Promise<void> {
    await this.prisma.scoreUpload.updateMany({
      where: { id: uploadId, tenantId },
      data: { isCurrent: false, status: 'rolled_back' },
    });

    // 이전 업로드를 current로 복원
    const previous = await this.prisma.scoreUpload.findFirst({
      where: { evaluationId, tenantId, id: { not: uploadId }, status: { not: 'rolled_back' } },
      orderBy: { uploadedAt: 'desc' },
    });

    if (previous) {
      await this.prisma.scoreUpload.updateMany({
        where: { id: previous.id, tenantId },
        data: { isCurrent: true, status: 'active' },
      });
    }
  }
}
