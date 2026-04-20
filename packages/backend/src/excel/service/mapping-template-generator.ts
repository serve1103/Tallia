import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { ColumnDef } from '@tallia/shared';

@Injectable()
export class MappingTemplateGenerator {
  /**
   * D유형 매핑 테이블 엑셀 양식 생성
   * range 컬럼은 {label}_이상 / {label}_미만 두 열로 확장
   */
  async generate(inputColumns: ColumnDef[]): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('매핑 테이블');

    const headers: string[] = [];
    for (const col of inputColumns) {
      if (col.type === 'range') {
        headers.push(`${col.label}_이상`);
        headers.push(`${col.label}_미만`);
      } else {
        headers.push(col.label);
      }
    }
    headers.push('환산점수');

    sheet.addRow(headers);
    this.styleHeader(sheet);

    return workbook;
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
