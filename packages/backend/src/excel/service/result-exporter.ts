import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { ScoreEntity } from '../../scores/repository/scores.repository';

interface IntermediateStep {
  blockIndex: number;
  blockType: string;
  label: string;
  output: unknown;
}

type ScalarOutput = { value: number };
type SubjectScoresOutput = { subjects: Array<{ id?: string; name?: string; score: number }> };
type QuestionScoresOutput = {
  scores: Array<{ qNo: number; correct: boolean; score: number; __subjectId?: string }>;
};

function isScalar(v: unknown): v is ScalarOutput {
  return typeof v === 'object' && v !== null && 'value' in v && typeof (v as ScalarOutput).value === 'number';
}
function isSubjectScores(v: unknown): v is SubjectScoresOutput {
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as SubjectScoresOutput).subjects) &&
    (v as SubjectScoresOutput).subjects.every((s) => typeof s.score === 'number')
  );
}
function isQuestionScores(v: unknown): v is QuestionScoresOutput {
  return typeof v === 'object' && v !== null && Array.isArray((v as QuestionScoresOutput).scores);
}

@Injectable()
export class ResultExporter {
  async export(scores: ScoreEntity[], includeIntermediate = false): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    if (!includeIntermediate) {
      this.writeBasicSheet(workbook, scores);
      return workbook;
    }

    // includeIntermediate: 중간 계산을 유저 친화적으로 분리한 멀티 시트 출력
    const schema = this.buildSchema(scores);
    this.writeSummarySheet(workbook, scores, schema);
    if (schema.hasQuestionScores) {
      this.writeQuestionSheet(workbook, scores);
    }
    return workbook;
  }

  /** 요약 시트 헤더 확장에 필요한 메타 수집. */
  private buildSchema(scores: ScoreEntity[]) {
    // 블록 순서 유지를 위해 (blockIndex, label, blockType, 유형) 기록.
    // 과목 이름 집합도 블록별로 수집.
    const blockOrder: Array<{ blockIndex: number; label: string; blockType: string; kind: 'scalar' | 'subjects' | 'question' | 'json' }> = [];
    const subjectsByBlock = new Map<number, string[]>();
    let hasQuestionScores = false;

    const seenBlocks = new Set<number>();
    for (const score of scores) {
      const steps = this.getSteps(score);
      for (const step of steps) {
        if (!seenBlocks.has(step.blockIndex)) {
          seenBlocks.add(step.blockIndex);
          const kind: 'scalar' | 'subjects' | 'question' | 'json' =
            isScalar(step.output) ? 'scalar'
              : isSubjectScores(step.output) ? 'subjects'
                : isQuestionScores(step.output) ? 'question'
                  : 'json';
          blockOrder.push({ blockIndex: step.blockIndex, label: step.label, blockType: step.blockType, kind });
        }
        if (isSubjectScores(step.output)) {
          const list = subjectsByBlock.get(step.blockIndex) ?? [];
          for (const s of step.output.subjects) {
            const name = s.name ?? s.id ?? '';
            if (name && !list.includes(name)) list.push(name);
          }
          subjectsByBlock.set(step.blockIndex, list);
        }
        if (isQuestionScores(step.output)) {
          hasQuestionScores = true;
        }
      }
    }

    blockOrder.sort((a, b) => a.blockIndex - b.blockIndex);
    return { blockOrder, subjectsByBlock, hasQuestionScores };
  }

  private getSteps(score: ScoreEntity): IntermediateStep[] {
    const ir = score.intermediateResults;
    return Array.isArray(ir) ? (ir as IntermediateStep[]) : [];
  }

  /** includeIntermediate=false: 기존 단순 시트 */
  private writeBasicSheet(workbook: ExcelJS.Workbook, scores: ScoreEntity[]) {
    const sheet = workbook.addWorksheet('결과');
    const headers = ['수험번호', '수험자명', '원점수', '환산점수', '과락', '오류'];
    sheet.addRow(headers);
    this.styleHeader(sheet);

    for (const score of scores) {
      sheet.addRow([
        score.examineeNo,
        score.examineeName,
        score.rawScore,
        score.convertedScore,
        score.failFlag ? 'Y' : 'N',
        score.errorFlag ? score.errorMessage ?? 'Y' : 'N',
      ]);
    }
    sheet.columns.forEach((col) => { col.width = 15; });
  }

  /** includeIntermediate=true: 블록별 컬럼 확장 요약 시트 */
  private writeSummarySheet(
    workbook: ExcelJS.Workbook,
    scores: ScoreEntity[],
    schema: ReturnType<ResultExporter['buildSchema']>,
  ) {
    const sheet = workbook.addWorksheet('결과 요약');

    // 헤더 구성
    const headers: string[] = ['수험번호', '수험자명', '원점수', '환산점수', '과락', '오류'];
    const blockHeaderMeta: Array<{ blockIndex: number; kind: 'scalar' | 'subjects' | 'question' | 'json'; subjectName?: string; suffix?: string }> = [];

    for (const b of schema.blockOrder) {
      if (b.kind === 'scalar') {
        headers.push(b.label);
        blockHeaderMeta.push({ blockIndex: b.blockIndex, kind: 'scalar' });
      } else if (b.kind === 'subjects') {
        const names = schema.subjectsByBlock.get(b.blockIndex) ?? [];
        for (const name of names) {
          headers.push(`${b.label} - ${name}`);
          blockHeaderMeta.push({ blockIndex: b.blockIndex, kind: 'subjects', subjectName: name });
        }
      } else if (b.kind === 'question') {
        headers.push(`${b.label} 정답 수`, `${b.label} 획득 점수`);
        blockHeaderMeta.push({ blockIndex: b.blockIndex, kind: 'question', suffix: 'correct' });
        blockHeaderMeta.push({ blockIndex: b.blockIndex, kind: 'question', suffix: 'total' });
      } else {
        // json fallback (드물어야 함)
        headers.push(b.label);
        blockHeaderMeta.push({ blockIndex: b.blockIndex, kind: 'json' });
      }
    }

    sheet.addRow(headers);
    this.styleHeader(sheet);

    // 데이터 행
    for (const score of scores) {
      const stepMap = new Map<number, IntermediateStep>();
      for (const step of this.getSteps(score)) stepMap.set(step.blockIndex, step);

      const row: unknown[] = [
        score.examineeNo,
        score.examineeName,
        score.rawScore,
        score.convertedScore,
        score.failFlag ? 'Y' : 'N',
        score.errorFlag ? score.errorMessage ?? 'Y' : 'N',
      ];

      for (const meta of blockHeaderMeta) {
        const step = stepMap.get(meta.blockIndex);
        if (!step) {
          row.push(null);
          continue;
        }
        if (meta.kind === 'scalar' && isScalar(step.output)) {
          row.push(step.output.value);
        } else if (meta.kind === 'subjects' && isSubjectScores(step.output)) {
          const match = step.output.subjects.find(
            (s) => (s.name ?? s.id) === meta.subjectName,
          );
          row.push(match ? match.score : null);
        } else if (meta.kind === 'question' && isQuestionScores(step.output)) {
          if (meta.suffix === 'correct') {
            row.push(step.output.scores.filter((s) => s.correct).length);
          } else {
            row.push(step.output.scores.reduce((a, b) => a + b.score, 0));
          }
        } else {
          row.push(JSON.stringify(step.output));
        }
      }
      sheet.addRow(row);
    }
    sheet.columns.forEach((col) => { col.width = 14; });
  }

  /** B유형 자동채점 문항별 상세 시트 */
  private writeQuestionSheet(workbook: ExcelJS.Workbook, scores: ScoreEntity[]) {
    const sheet = workbook.addWorksheet('문항별 채점');

    // 모든 score 를 스캔해 최대 문항번호 수집
    const qNos = new Set<number>();
    for (const score of scores) {
      for (const step of this.getSteps(score)) {
        if (isQuestionScores(step.output)) {
          for (const s of step.output.scores) qNos.add(s.qNo);
        }
      }
    }
    const sortedQ = [...qNos].sort((a, b) => a - b);

    const headers = ['수험번호', '수험자명'];
    for (const n of sortedQ) headers.push(`Q${n}`);
    headers.push('정답 수', '획득 점수');
    sheet.addRow(headers);
    this.styleHeader(sheet);

    for (const score of scores) {
      const qStep = this.getSteps(score).find((s) => isQuestionScores(s.output));
      const qMap = new Map<number, { correct: boolean; score: number }>();
      if (qStep && isQuestionScores(qStep.output)) {
        for (const s of qStep.output.scores) qMap.set(s.qNo, { correct: s.correct, score: s.score });
      }

      const row: unknown[] = [score.examineeNo, score.examineeName];
      let correctCount = 0;
      let totalScore = 0;
      for (const n of sortedQ) {
        const entry = qMap.get(n);
        if (!entry) {
          row.push('-');
        } else {
          row.push(entry.score);
          if (entry.correct) correctCount += 1;
          totalScore += entry.score;
        }
      }
      row.push(correctCount, totalScore);
      sheet.addRow(row);
    }
    sheet.columns.forEach((col) => { col.width = 10; });
    // 이름 컬럼은 조금 넓게
    if (sheet.getColumn(2)) sheet.getColumn(2).width = 14;
  }

  private styleHeader(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F8FA' },
    };
  }
}
