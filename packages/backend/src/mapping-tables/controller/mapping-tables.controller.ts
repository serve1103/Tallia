import { Controller, Get, Post, Body, Param, Res, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
];

@Controller('evaluations/:id/mapping-table')
export class MappingTablesController {
  @Get()
  async get(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    // Phase 7 — MappingTable + entries 조회
    return { data: null };
  }

  @Post('save')
  async save(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body() body: unknown) {
    return { data: { saved: true } };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('xlsx 또는 xls 파일만 업로드할 수 있습니다'), false);
      }
    },
  }))
  async upload(@Param('id') id: string, @CurrentTenant() tenantId: string, @UploadedFile() file: Express.Multer.File) {
    return { data: { fileName: file?.originalname, status: 'uploaded' } };
  }

  @Get('download')
  async download(@Param('id') id: string, @CurrentTenant() tenantId: string, @Res() res: Response) {
    res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Phase 7에서 구현', details: [] } });
  }
}
