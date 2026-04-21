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
    // 기존 active 업로드 비활성화 + 과거 계산 점수 정리 + 신규 업로드 생성 원자 처리.
    // 과거 scores 를 남겨두면 uploadId 필터 누락 시 수험번호 중복 표시되므로 같은 트랜잭션에서 삭제.
    const [, , upload] = await this.prisma.$transaction([
      this.prisma.scoreUpload.updateMany({
        where: { evaluationId: dto.evaluationId, tenantId: dto.tenantId, isCurrent: true },
        data: { isCurrent: false, status: 'rolled_back' },
      }),
      this.prisma.score.deleteMany({
        where: { evaluationId: dto.evaluationId, tenantId: dto.tenantId },
      }),
      this.prisma.scoreUpload.create({
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
      }),
    ]);

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
