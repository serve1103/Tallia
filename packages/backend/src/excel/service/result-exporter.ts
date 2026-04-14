import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { ScoreEntity } from '../../scores/repository/scores.repository';

@Injectable()
export class ResultExporter {
  async export(scores: ScoreEntity[], includeIntermediate = false): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('결과');

    const headers = ['수험번호', '수험자명', '원점수', '환산점수', '과락', '오류'];
    if (includeIntermediate) {
      headers.push('중간결과');
    }

    sheet.addRow(headers);

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F8FA' },
    };

    for (const score of scores) {
      const row: unknown[] = [
        score.examineeNo,
        score.examineeName,
        score.rawScore,
        score.convertedScore,
        score.failFlag ? 'Y' : 'N',
        score.errorFlag ? score.errorMessage ?? 'Y' : 'N',
      ];

      if (includeIntermediate) {
        row.push(JSON.stringify(score.intermediateResults));
      }

      sheet.addRow(row);
    }

    sheet.columns.forEach((col) => {
      col.width = 15;
    });

    return workbook;
  }
}
