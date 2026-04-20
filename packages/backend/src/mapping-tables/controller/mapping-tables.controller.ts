import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { MappingTablesApplication } from '../application/mapping-tables.application';

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
];

@Controller('evaluations/:id/mapping-table')
export class MappingTablesController {
  constructor(private readonly application: MappingTablesApplication) {}

  @Get()
  async get(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const data = await this.application.findByEvaluation(id, tenantId);
    return { data };
  }

  @Post('save')
  async save(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { entries: Array<{ conditions: Record<string, string | number>; score: number; sortOrder?: number }> },
  ) {
    const data = await this.application.saveEntries(id, tenantId, body);
    return { data };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('xlsx 또는 xls 파일만 업로드할 수 있습니다'), false);
        }
      },
    }),
  )
  async upload(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 없습니다');
    }
    const data = await this.application.uploadFromFile(id, tenantId, file.buffer);
    return { data };
  }

  @Get('download')
  async download(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Res() res: Response,
  ) {
    await this.application.downloadTemplate(id, tenantId, res);
  }
}
