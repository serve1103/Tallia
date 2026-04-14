import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { EvalConfig, TypeAConfig, TypeBConfig, TypeCConfig, TypeDConfig } from '@tallia/shared';

@Injectable()
export class TemplateGenerator {
  async generate(evalType: string, config: EvalConfig): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    switch (evalType) {
      case 'A':
        this.generateTypeA(workbook, config as TypeAConfig);
        break;
      case 'B':
        this.generateTypeB(workbook, config as TypeBConfig);
        break;
      case 'C':
        this.generateTypeC(workbook, config as TypeCConfig);
        break;
      case 'D':
        this.generateTypeD(workbook, config as TypeDConfig);
        break;
    }

    return workbook;
  }

  private generateTypeA(workbook: ExcelJS.Workbook, config: TypeAConfig) {
    const sheet = workbook.addWorksheet('평가 데이터');
    const headers = ['수험번호', '수험자명'];

    for (const item of config.items) {
      for (let c = 1; c <= config.maxCommitteeCount; c++) {
        headers.push(`${item.name}_위원${c}`);
      }
    }

    sheet.addRow(headers);
    this.styleHeader(sheet);
  }

  private generateTypeB(workbook: ExcelJS.Workbook, config: TypeBConfig) {
    for (const subject of config.subjects) {
      const sheet = workbook.addWorksheet(subject.name);
      const headers = ['수험번호', '수험자명', '시험유형'];

      for (let q = 1; q <= subject.questionCount; q++) {
        headers.push(`Q${q}`);
      }

      sheet.addRow(headers);
      this.styleHeader(sheet);
    }
  }

  private generateTypeC(workbook: ExcelJS.Workbook, config: TypeCConfig) {
    const sheet = workbook.addWorksheet('채점 데이터');
    const headers = ['수험번호', '수험자명', '위원번호'];

    for (const question of config.questions) {
      if (question.subQuestions && question.subQuestions.length > 0) {
        for (const sub of question.subQuestions) {
          headers.push(`${question.name}_${sub.name}`);
        }
      } else {
        headers.push(question.name);
      }
    }

    sheet.addRow(headers);
    this.styleHeader(sheet);
  }

  private generateTypeD(workbook: ExcelJS.Workbook, config: TypeDConfig) {
    const sheet = workbook.addWorksheet('변환 데이터');
    const headers = ['수험번호', '수험자명'];

    for (const col of config.inputColumns) {
      headers.push(col.label);
    }

    sheet.addRow(headers);
    this.styleHeader(sheet);
  }

  private styleHeader(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F8FA' },
    };
    sheet.columns.forEach((col) => {
      col.width = 15;
    });
  }
}
