import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ParsedRow {
  examineeNo: string;
  examineeName: string;
  data: Record<string, unknown>;
}

export interface ParseError {
  row: number;
  examineeNo: string;
  examineeName: string;
  column: string;
  message: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: ParseError[];
}

@Injectable()
export class UploadParser {
  async parse(buffer: Buffer): Promise<ParseResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('시트가 없습니다');

    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? '');
    });

    const rows: ParsedRow[] = [];
    const errors: ParseError[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const examineeNo = String(row.getCell(1).value ?? '').trim();
      const examineeName = String(row.getCell(2).value ?? '').trim();

      if (!examineeNo) {
        errors.push({ row: rowNumber, examineeNo: '', examineeName: '', column: headers[1] ?? 'A', message: '수험번호가 비어있습니다' });
        return;
      }

      const data: Record<string, unknown> = {};
      row.eachCell((cell, colNumber) => {
        if (colNumber > 2) {
          data[headers[colNumber] ?? `col${colNumber}`] = cell.value;
        }
      });

      rows.push({ examineeNo, examineeName, data });
    });

    return { rows, errors };
  }
}
