import { Controller, Get, Post, Param, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('evaluations/:id/excel')
export class ExcelController {
  @Get('template')
  async downloadTemplate(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Res() res: Response,
  ) {
    // Phase 6 — 유형별 양식 생성 후 스트리밍 다운로드
    res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Phase 6에서 구현', details: [] } });
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Phase 6 — 유형별 파싱 + 검증 + JSONB 저장
    return { data: { fileName: file?.originalname, status: 'not_implemented' } };
  }

  @Get('uploads')
  async getUploads(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    // Phase 6 — 업로드 이력 조회
    return { data: [] };
  }

  @Post('rollback/:uploadId')
  async rollback(
    @Param('id') id: string,
    @Param('uploadId') uploadId: string,
    @CurrentTenant() tenantId: string,
  ) {
    // Phase 6 — is_current 플래그 교체
    return { data: { rolledBack: true } };
  }
}
