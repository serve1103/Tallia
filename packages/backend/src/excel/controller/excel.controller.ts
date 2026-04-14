import { Controller, Get, Post, Param, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExcelApplication } from '../application/excel.application';

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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.excelApp.upload(id, tenantId, user.id, file);
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
