import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { TypeBConfig, TypeCConfig } from '@tallia/shared';

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

/** B유형 시트 1행에서 파싱된 과목 응답 */
export interface SubjectAnswerData {
  subjectId: string;
  examType: string;
  answers: Record<number, string>;
}

/** B유형 ParsedRow.data 구조 */
export interface TypeBRowData {
  subjects: SubjectAnswerData[];
}

/** C유형 위원별 채점 데이터 */
export interface CommitteeScoreData {
  committeeNo: number;
  /** 키: 문항ID 또는 "문항ID-소문항ID" */
  questions: Record<string, number>;
}

/** C유형 ParsedRow.data 구조 (복수위원) */
export interface TypeCRowData {
  committees: CommitteeScoreData[];
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
      if (rowNumber === 1) return; // 헤더 건너뜀

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

  /**
   * B유형 전용 파서: 과목별 시트를 모두 순회하여 수험번호 기준으로 병합.
   * 시트명 ↔ config.subjects[i].name 매칭 (공백 trim).
   * 각 행: 수험번호(1열), 수험자명(2열), 시험유형(3열), Q1..Qn(4열~).
   */
  async parseTypeB(buffer: Buffer, config: TypeBConfig): Promise<ParseResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    if (workbook.worksheets.length === 0) {
      throw new BadRequestException('시트가 없습니다');
    }

    // 수험번호 → 병합 중인 ParsedRow
    const mergedMap = new Map<string, ParsedRow>();
    const errors: ParseError[] = [];

    for (const sheet of workbook.worksheets) {
      const sheetName = sheet.name.trim();

      // 시트명으로 config에서 과목 찾기
      const subject = config.subjects.find((s) => s.name.trim() === sheetName);
      if (!subject) {
        // 등록되지 않은 시트는 건너뜀
        continue;
      }

      // 헤더 파싱 (Q1, Q2, ... 위치 확인)
      const headerRow = sheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? '').trim();
      });

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // 헤더 건너뜀

        const examineeNo = String(row.getCell(1).value ?? '').trim();
        const examineeName = String(row.getCell(2).value ?? '').trim();
        const examType = String(row.getCell(3).value ?? '').trim();

        if (!examineeNo) {
          errors.push({
            row: rowNumber,
            examineeNo: '',
            examineeName: '',
            column: '수험번호',
            message: `[${sheetName}] 수험번호가 비어있습니다`,
          });
          return;
        }

        // Q1..Qn 파싱 (4열~, 헤더가 'Q숫자' 패턴인 열)
        const answers: Record<number, string> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber] ?? '';
          const qMatch = /^Q(\d+)$/i.exec(header);
          if (qMatch) {
            const qNo = parseInt(qMatch[1], 10);
            answers[qNo] = String(cell.value ?? '').trim();
          }
        });

        const subjectData: SubjectAnswerData = {
          subjectId: subject.id,
          examType,
          answers,
        };

        // 수험번호 기준 병합
        if (mergedMap.has(examineeNo)) {
          const existing = mergedMap.get(examineeNo)!;
          (existing.data as unknown as TypeBRowData).subjects.push(subjectData);
        } else {
          const typeBData: TypeBRowData = { subjects: [subjectData] };
          mergedMap.set(examineeNo, {
            examineeNo,
            examineeName,
            data: typeBData as unknown as Record<string, unknown>,  // B유형 data는 TypeBRowData 구조
          });
        }
      });
    }

    return { rows: Array.from(mergedMap.values()), errors };
  }

  /**
   * C유형 전용 파서: 단일 시트에서 수험번호별로 복수 위원 행을 그룹화.
   * 헤더: 수험번호(1열), 수험자명(2열), 위원번호(3열), 문항점수...(4열~)
   * 동일 수험번호의 행이 여러 개일 경우 각 행이 한 위원의 채점 데이터.
   */
  async parseTypeC(buffer: Buffer, config: TypeCConfig): Promise<ParseResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('시트가 없습니다');

    // 헤더 파싱 (4열~이 문항점수 컬럼)
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? '').trim();
    });

    // 수험번호 → 병합 중인 ParsedRow
    const mergedMap = new Map<string, ParsedRow>();
    const errors: ParseError[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 건너뜀

      const examineeNo = String(row.getCell(1).value ?? '').trim();
      const examineeName = String(row.getCell(2).value ?? '').trim();
      const committeeNoRaw = row.getCell(3).value;
      const committeeNo = committeeNoRaw != null ? Number(committeeNoRaw) : rowNumber - 1;

      if (!examineeNo) {
        errors.push({
          row: rowNumber,
          examineeNo: '',
          examineeName: '',
          column: '수험번호',
          message: '수험번호가 비어있습니다',
        });
        return;
      }

      // 4열~: 문항 점수 파싱 (헤더명을 키로 사용)
      const questions: Record<string, number> = {};
      row.eachCell((cell, colNumber) => {
        if (colNumber <= 3) return;
        const header = headers[colNumber] ?? `col${colNumber}`;
        const val = cell.value;
        if (val !== null && val !== undefined && val !== '') {
          questions[header] = Number(val) || 0;
        }
      });

      const committeeData: CommitteeScoreData = { committeeNo, questions };

      if (mergedMap.has(examineeNo)) {
        const existing = mergedMap.get(examineeNo)!;
        (existing.data as unknown as TypeCRowData).committees.push(committeeData);
      } else {
        const typeCData: TypeCRowData = { committees: [committeeData] };
        mergedMap.set(examineeNo, {
          examineeNo,
          examineeName,
          data: typeCData as unknown as Record<string, unknown>,
        });
      }
    });

    return { rows: Array.from(mergedMap.values()), errors };
  }
}
