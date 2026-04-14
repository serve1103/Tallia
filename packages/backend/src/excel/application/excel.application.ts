import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { ExcelService } from '../service/excel.service';
import { TemplateGenerator } from '../service/template-generator';
import { UploadParser } from '../service/upload-parser';
import { ResultExporter } from '../service/result-exporter';
import { EvaluationsService } from '../../evaluations/service/evaluations.service';
import type { EvalConfig } from '@tallia/shared';

@Injectable()
export class ExcelApplication {
  constructor(
    private readonly excelService: ExcelService,
    private readonly templateGenerator: TemplateGenerator,
    private readonly uploadParser: UploadParser,
    private readonly resultExporter: ResultExporter,
    private readonly evaluationsService: EvaluationsService,
  ) {}

  async downloadTemplate(evaluationId: string, tenantId: string, res: Response) {
    const evaluation = await this.evaluationsService.findById(evaluationId, tenantId);
    const config = evaluation.config as EvalConfig;
    const workbook = await this.templateGenerator.generate(evaluation.type, config);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=template_${evaluationId}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  }

  async upload(evaluationId: string, tenantId: string, userId: string, file: Express.Multer.File) {
    const parseResult = await this.uploadParser.parse(file.buffer);

    const upload = await this.excelService.createUpload({
      tenantId,
      evaluationId,
      fileName: file.originalname,
      fileSize: file.size,
      rowCount: parseResult.rows.length,
      rawData: parseResult.rows,
      validationErrors: parseResult.errors,
      uploadedBy: userId,
    });

    return upload;
  }

  async getUploads(evaluationId: string, tenantId: string) {
    return this.excelService.getUploads(evaluationId, tenantId);
  }

  async rollback(evaluationId: string, uploadId: string, tenantId: string) {
    await this.excelService.rollback(evaluationId, uploadId, tenantId);
  }
}
