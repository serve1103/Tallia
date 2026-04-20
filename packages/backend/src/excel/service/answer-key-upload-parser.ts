import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { AnswerKeyEntry } from './answer-key-template-generator';

export interface AnswerKeyParseResult {
  answerKey: AnswerKeyEntry[];
}

@Injectable()
export class AnswerKeyUploadParser {
  /**
   * 정답지 엑셀 파싱
   * 헤더: 문항번호 | 정답 | 복수정답 | 배점
   * 복수정답 컬럼: '복수' 이면 answers를 쉼표로 split, 아니면 단일 배열
   * 배점 컬럼: 비어있거나 0이면 score=0 (구간/균등 fallback)
   */
  async parse(buffer: Buffer): Promise<AnswerKeyParseResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('시트가 없습니다');

    // 헤더 파싱 (1행)
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? '').trim();
    });

    // 필수 컬럼 인덱스 탐색
    const qNoIdx = headers.findIndex((h) => h === '문항번호');
    const answerIdx = headers.findIndex((h) => h === '정답');
    const multiIdx = headers.findIndex((h) => h === '복수정답');
    const scoreIdx = headers.findIndex((h) => h === '배점');

    if (qNoIdx === -1 || answerIdx === -1) {
      throw new BadRequestException('엑셀에 "문항번호" 또는 "정답" 열이 없습니다');
    }

    const answerKey: AnswerKeyEntry[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 건너뜀

      const qNoRaw = row.getCell(qNoIdx).value;
      if (qNoRaw === null || qNoRaw === undefined || qNoRaw === '') return;

      const questionNo = Number(qNoRaw);
      if (Number.isNaN(questionNo) || questionNo <= 0) return;

      const answerRaw = String(row.getCell(answerIdx).value ?? '').trim();
      if (answerRaw === '') return;

      const multiRaw = multiIdx !== -1
        ? String(row.getCell(multiIdx).value ?? '').trim()
        : '';
      const isMulti = multiRaw === '복수';

      const answers: string[] = isMulti
        ? answerRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [answerRaw];

      const scoreRaw = scoreIdx !== -1 ? row.getCell(scoreIdx).value : null;
      const score = scoreRaw !== null && scoreRaw !== undefined && scoreRaw !== ''
        ? Number(scoreRaw) || 0
        : 0;

      answerKey.push({ questionNo, answers, score });
    });

    return { answerKey };
  }
}
