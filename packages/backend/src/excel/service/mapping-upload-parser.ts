import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { UpsertMappingEntryDto } from '../../mapping-tables/repository/mapping-tables.repository';

@Injectable()
export class MappingUploadParser {
  /**
   * 매핑 테이블 엑셀 파싱
   * 헤더 규약:
   *   {label}_이상  → conditions key: {label}_min
   *   {label}_미만  → conditions key: {label}_max
   *   환산점수       → entry.score
   */
  async parse(buffer: Buffer): Promise<UpsertMappingEntryDto[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('시트가 없습니다');

    // 헤더 파싱
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? '').trim();
    });

    const scoreColIndex = headers.findIndex((h) => h === '환산점수');
    if (scoreColIndex === -1) {
      throw new BadRequestException('엑셀에 "환산점수" 열이 없습니다');
    }

    const entries: UpsertMappingEntryDto[] = [];
    let sortOrder = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 건너뜀

      // 빈 행 건너뜀
      const scoreCell = row.getCell(scoreColIndex);
      if (scoreCell.value === null || scoreCell.value === undefined || scoreCell.value === '') return;

      const score = Number(scoreCell.value);
      if (Number.isNaN(score)) return;

      const conditions: Record<string, string | number> = {};

      headers.forEach((header, colIndex) => {
        if (colIndex === 0) return; // ExcelJS는 1-based, index 0은 비어있음
        if (colIndex === scoreColIndex) return;

        const cellValue = row.getCell(colIndex).value;
        const val = cellValue !== null && cellValue !== undefined ? cellValue : '';

        if (header.endsWith('_이상')) {
          const baseLabel = header.replace(/_이상$/, '');
          conditions[`${baseLabel}_min`] = Number(val);
        } else if (header.endsWith('_미만')) {
          const baseLabel = header.replace(/_미만$/, '');
          conditions[`${baseLabel}_max`] = Number(val);
        } else {
          conditions[header] = String(val);
        }
      });

      entries.push({
        conditions: conditions as any,
        score,
        sortOrder,
      });
      sortOrder++;
    });

    return entries;
  }
}
