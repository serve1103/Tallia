import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface AnswerKeyEntry {
  questionNo: number;
  answers: string[];
  score: number;
}

@Injectable()
export class AnswerKeyTemplateGenerator {
  /**
   * 정답지 엑셀 양식 생성
   * 헤더: 문항번호 | 정답 | 복수정답 | 배점
   * 기존 answerKey가 있으면 데이터 반영, 없으면 questionCount만큼 빈 행 생성
   */
  async generate(
    sheetName: string,
    questionCount: number,
    existingAnswerKey?: AnswerKeyEntry[],
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    // 시트명 특수문자 치환 (공백 → _, / → _, 31자 제한)
    const safeName = sheetName.replace(/[\s/\\?*[\]:]/g, '_').slice(0, 31);
    const sheet = workbook.addWorksheet(safeName || '정답지');

    sheet.addRow(['문항번호', '정답', '복수정답', '배점']);
    this.styleHeader(sheet);

    for (let i = 1; i <= questionCount; i++) {
      const entry = existingAnswerKey?.find((e) => e.questionNo === i);
      if (entry) {
        const isMulti = entry.answers.length > 1;
        sheet.addRow([
          i,
          entry.answers.join(','),
          isMulti ? '복수' : '단일',
          entry.score > 0 ? entry.score : 0,
        ]);
      } else {
        sheet.addRow([i, '', '단일', 0]);
      }
    }

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
    sheet.columns = [
      { width: 12 },
      { width: 18 },
      { width: 12 },
      { width: 10 },
    ];
  }
}
