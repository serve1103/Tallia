import { Controller, Get, Post, Param, Query, UploadedFile, UseInterceptors, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ExcelApplication } from '../application/excel.application';

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
];

@Controller('evaluations/:id/excel')
export class ExcelController {
  constructor(private readonly excelApp: ExcelApplication) {}

  @Get('template')
  async downloadTemplate(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Res() res: Response,
  ) {
    await this.excelApp.downloadTemplate(id, tenantId, res);
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
  async upload(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Query('skipErrors') skipErrors?: string,
  ) {
    const result = await this.excelApp.upload(id, tenantId, user.sub, file, skipErrors === 'true');
    return { data: result };
  }

  @Get('uploads')
  async getUploads(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const uploads = await this.excelApp.getUploads(id, tenantId);
    return { data: uploads };
  }

  @Post('rollback/:uploadId')
  async rollback(
    @Param('id') id: string,
    @Param('uploadId') uploadId: string,
    @CurrentTenant() tenantId: string,
  ) {
    await this.excelApp.rollback(id, uploadId, tenantId);
    return { data: { success: true } };
  }
}
