import { useState, useEffect } from 'react';
import { Input, Select, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { AnswerKeyEntry } from '../api/evaluations';

interface AnswerCell {
  answer: string;
  multi: boolean;
}

interface Props {
  evaluationId: string;
  subjectId: string;
  examType: string;
  questionCount: number;
  existingAnswerKey?: AnswerKeyEntry[];
  onSave: (subjectId: string, examType: string, answerKey: AnswerKeyEntry[]) => Promise<void>;
  saving?: boolean;
}

function buildInitialCells(questionCount: number, existing?: AnswerKeyEntry[]): Record<number, AnswerCell> {
  const cells: Record<number, AnswerCell> = {};
  for (let i = 1; i <= questionCount; i++) {
    const entry = existing?.find((e) => e.questionNo === i);
    cells[i] = {
      answer: entry ? entry.answers.join(',') : '',
      multi: entry ? entry.answers.length > 1 : false,
    };
  }
  return cells;
}

export function AnswerKeyEditor({
  subjectId,
  examType,
  questionCount,
  existingAnswerKey,
  onSave,
  saving,
}: Props) {
  const [cells, setCells] = useState<Record<number, AnswerCell>>(() =>
    buildInitialCells(questionCount, existingAnswerKey),
  );

  useEffect(() => {
    setCells(buildInitialCells(questionCount, existingAnswerKey));
  }, [questionCount, existingAnswerKey]);

  const updateCell = (n: number, patch: Partial<AnswerCell>) => {
    setCells((prev) => ({ ...prev, [n]: { ...prev[n], ...patch } }));
  };

  const handleSave = async () => {
    const answerKey: AnswerKeyEntry[] = Object.entries(cells)
      .filter(([, cell]) => cell.answer.trim() !== '')
      .map(([num, cell]) => ({
        questionNo: Number(num),
        answers: cell.multi
          ? cell.answer.split(',').map((s) => s.trim()).filter(Boolean)
          : [cell.answer.trim()],
        score: 0,
      }));
    try {
      await onSave(subjectId, examType, answerKey);
      message.success(`${examType}형 정답지 저장 완료`);
    } catch {
      message.error('정답지 저장에 실패했습니다');
    }
  };

  // Render in rows of 10
  const rows: number[][] = [];
  for (let start = 1; start <= questionCount; start += 10) {
    rows.push(
      Array.from({ length: Math.min(10, questionCount - start + 1) }, (_, i) => start + i),
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#888' }}>
        문항별 정답 입력, 복수정답은 쉼표 구분 (예: 1,3)
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: 8,
          marginBottom: 16,
        }}
      >
        {rows.flat().map((n) => {
          const cell = cells[n] ?? { answer: '', multi: false };
          return (
            <div
              key={n}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>{n}번</span>
              <Input
                size="small"
                value={cell.answer}
                onChange={(e) => updateCell(n, { answer: e.target.value })}
                placeholder={cell.multi ? '예: 1,3' : ''}
                style={{
                  width: '100%',
                  backgroundColor: cell.multi ? '#fafafa' : undefined,
                  textAlign: 'center',
                }}
                maxLength={20}
              />
              <Select
                size="small"
                value={cell.multi ? 'multi' : 'single'}
                onChange={(v) => updateCell(n, { multi: v === 'multi' })}
                style={{ width: '100%' }}
                options={[
                  { value: 'single', label: '단일' },
                  { value: 'multi', label: '복수' },
                ]}
              />
            </div>
          );
        })}
      </div>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        loading={saving}
        onClick={handleSave}
        size="small"
      >
        정답지 저장
      </Button>
    </div>
  );
}
