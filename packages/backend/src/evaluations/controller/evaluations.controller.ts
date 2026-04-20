import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { EvaluationsApplication } from '../application/evaluations.application';

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsApp: EvaluationsApplication) {}

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() body: { name: string; type: string; academicYear?: string; admissionType?: string; config: unknown },
  ) {
    const evaluation = await this.evaluationsApp.create(tenantId, body);
    return { data: evaluation };
  }

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('academic_year') academicYear?: string,
    @Query('admission_type') admissionType?: string,
    @Query('type') type?: string,
  ) {
    const evaluations = await this.evaluationsApp.findAll({ tenantId, academicYear, admissionType, type });
    return { data: evaluations };
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const evaluation = await this.evaluationsApp.findById(id, tenantId);
    return { data: evaluation };
  }

  @Post(':id/update')
  async update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const evaluation = await this.evaluationsApp.update(id, tenantId, body);
    return { data: evaluation };
  }

  @Post(':id/delete')
  async delete(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    await this.evaluationsApp.delete(id, tenantId);
    return { data: { deleted: true } };
  }

  @Post(':id/copy')
  async copy(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const evaluation = await this.evaluationsApp.copy(id, tenantId);
    return { data: evaluation };
  }

  // --- Config 엔드포인트 (§3.5) ---

  @Get(':id/config')
  async getConfig(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const config = await this.evaluationsApp.getConfig(id, tenantId);
    return { data: config };
  }

  @Post(':id/config/save')
  async saveConfig(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { config: unknown },
  ) {
    const evaluation = await this.evaluationsApp.saveConfig(id, tenantId, body.config);
    return { data: evaluation };
  }

  @Get(':id/config/preview')
  async previewConfig(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const config = await this.evaluationsApp.getConfig(id, tenantId);
    return { data: { config, preview: null } };
  }

  // --- B유형 정답지 (§3.11) ---

  @Post(':id/answer-key/save')
  async saveAnswerKey(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { subjectId: string; examType?: string; answerKey: unknown[]; scoreRanges?: unknown[] },
  ) {
    if (!body.subjectId || !body.answerKey) {
      throw new BadRequestException('subjectId와 answerKey는 필수입니다');
    }
    const result = await this.evaluationsApp.saveAnswerKey(
      id,
      tenantId,
      body.subjectId,
      body.answerKey,
      body.examType,
      body.scoreRanges,
    );
    return { data: result };
  }

  // --- B유형 정답지 엑셀 ---

  private static readonly ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  @Get(':id/answer-key/template')
  async downloadAnswerKeyTemplate(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Query('subjectId') subjectId: string,
    @Query('examType') examType: string | undefined,
    @Res() res: Response,
  ) {
    if (!subjectId) throw new BadRequestException('subjectId는 필수입니다');
    await this.evaluationsApp.downloadAnswerKeyTemplate(id, tenantId, subjectId, examType, res);
  }

  @Post(':id/answer-key/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('xlsx 또는 xls 파일만 업로드할 수 있습니다'), false);
        }
      },
    }),
  )
  async uploadAnswerKey(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Query('subjectId') subjectId: string,
    @Query('examType') examType: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!subjectId) throw new BadRequestException('subjectId는 필수입니다');
    if (!file) throw new BadRequestException('파일이 없습니다');
    const result = await this.evaluationsApp.uploadAnswerKey(id, tenantId, subjectId, examType, file.buffer);
    return { data: result };
  }

  @Post(':id/question-error')
  async reportQuestionError(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() body: { subjectId: string; questionNo: number; handling: 'all_correct' | 'exclude' },
  ) {
    if (!body.subjectId || body.questionNo == null || !body.handling) {
      throw new BadRequestException('subjectId, questionNo, handling은 필수입니다');
    }
    const result = await this.evaluationsApp.reportQuestionError(id, tenantId, body);
    return { data: result };
  }
}
