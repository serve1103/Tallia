import { Controller, Get, Post, Body, Param, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(@Param('id') id: string, @CurrentTenant() tenantId: string, @UploadedFile() file: Express.Multer.File) {
    return { data: { fileName: file?.originalname, status: 'uploaded' } };
  }

  @Get('download')
  async download(@Param('id') id: string, @CurrentTenant() tenantId: string, @Res() res: Response) {
    res.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Phase 7에서 구현', details: [] } });
  }
}
