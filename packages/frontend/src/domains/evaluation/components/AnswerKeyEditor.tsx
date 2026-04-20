import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Input, Select, Button, InputNumber, Card, Space, message, Upload } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { AnswerKeyEntry, ScoreRange } from '../api/evaluations';
import { downloadAnswerKeyTemplate, uploadAnswerKey } from '../api/evaluations';

interface AnswerCell {
  answer: string;
  multi: boolean;
  scoreOverride: number | null;
}

interface Props {
  evaluationId: string;
  subjectId: string;
  subjectMaxScore: number;
  examType: string;
  questionCount: number;
  existingAnswerKey?: AnswerKeyEntry[];
  existingScoreRanges?: ScoreRange[];
  onSave: (subjectId: string, examType: string, answerKey: AnswerKeyEntry[], scoreRanges: ScoreRange[]) => Promise<void>;
  saving?: boolean;
}

function buildInitialCells(questionCount: number, existing?: AnswerKeyEntry[]): Record<number, AnswerCell> {
  const cells: Record<number, AnswerCell> = {};
  for (let i = 1; i <= questionCount; i++) {
    const entry = existing?.find((e) => e.questionNo === i);
    cells[i] = {
      answer: entry ? entry.answers.join(',') : '',
      multi: entry ? entry.answers.length > 1 : false,
      scoreOverride: entry && entry.score > 0 ? entry.score : null,
    };
  }
  return cells;
}

/** scoreRanges 에서 qNo 에 해당하는 구간 배점 반환. 없으면 균등 분배값 반환. */
function computeDefaultScore(qNo: number, scoreRanges: ScoreRange[], subjectMaxScore: number, questionCount: number): number {
  const range = scoreRanges.find((r) => qNo >= r.start && qNo <= r.end);
  if (range) return range.score;
  const qc = questionCount > 0 ? questionCount : 1;
  return Math.round((subjectMaxScore / qc) * 100) / 100;
}

export function AnswerKeyEditor({
  evaluationId,
  subjectId,
  subjectMaxScore,
  examType,
  questionCount,
  existingAnswerKey,
  existingScoreRanges,
  onSave,
  saving,
}: Props) {
  const [cells, setCells] = useState<Record<number, AnswerCell>>(() =>
    buildInitialCells(questionCount, existingAnswerKey),
  );
  const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>(existingScoreRanges ?? []);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    setCells(buildInitialCells(questionCount, existingAnswerKey));
  }, [questionCount, existingAnswerKey]);

  useEffect(() => {
    setScoreRanges(existingScoreRanges ?? []);
  }, [existingScoreRanges]);

  const updateCell = (n: number, patch: Partial<AnswerCell>) => {
    setCells((prev) => ({ ...prev, [n]: { ...prev[n], ...patch } }));
  };

  const addRange = () => {
    setScoreRanges((prev) => [...prev, { start: 1, end: questionCount, score: 1 }]);
  };

  const updateRange = (idx: number, patch: Partial<ScoreRange>) => {
    setScoreRanges((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRange = (idx: number) => {
    setScoreRanges((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const answerKey: AnswerKeyEntry[] = Object.entries(cells)
      .filter(([, cell]) => cell.answer.trim() !== '')
      .map(([num, cell]) => ({
        questionNo: Number(num),
        answers: cell.multi
          ? cell.answer.split(',').map((s) => s.trim()).filter(Boolean)
          : [cell.answer.trim()],
        score: cell.scoreOverride ?? 0,
      }));
    try {
      await onSave(subjectId, examType, answerKey, scoreRanges);
      message.success(`${examType}형 정답지 저장 완료`);
    } catch {
      message.error('정답지 저장에 실패했습니다');
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadAnswerKeyTemplate(evaluationId, subjectId, examType);
    } catch {
      message.error('양식 다운로드에 실패했습니다');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadAnswerKey(evaluationId, subjectId, file, examType);
      // 업로드 = 서버 저장 완료. 평가 config 쿼리를 invalidate해서
      // existingAnswerKey가 새 값으로 내려오고 cells state가 갱신되게 함.
      await queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId, 'config'] });
      await queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId] });
      message.success('엑셀 업로드가 완료되었습니다');
    } catch {
      message.error('엑셀 업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
    return false; // prevent antd auto-upload
  };

  const focusInput = (n: number) => {
    inputRefs.current[n]?.focus();
  };

  const handleAnswerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, n: number) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const next = n + 1;
      if (next <= questionCount) {
        focusInput(next);
      }
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
      {/* 구간 배점 편집기 */}
      <Card
        size="small"
        title="구간 배점"
        style={{ marginBottom: 16 }}
        extra={
          <Button size="small" icon={<PlusOutlined />} onClick={addRange}>
            구간 추가
          </Button>
        }
      >
        {scoreRanges.length === 0 ? (
          <div style={{ fontSize: 13, color: '#888' }}>
            구간 없음 — 균등 분배 ({Math.round((subjectMaxScore / (questionCount || 1)) * 100) / 100}점/문항) 또는 문항별 override 사용
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {scoreRanges.map((range, idx) => (
              <Space key={idx} align="center">
                <span style={{ fontSize: 13, color: '#555' }}>시작</span>
                <InputNumber
                  size="small"
                  min={1}
                  max={questionCount}
                  value={range.start}
                  onChange={(v) => updateRange(idx, { start: v ?? 1 })}
                  style={{ width: 70 }}
                  tabIndex={-1}
                />
                <span style={{ fontSize: 13, color: '#888' }}>~</span>
                <span style={{ fontSize: 13, color: '#555' }}>끝</span>
                <InputNumber
                  size="small"
                  min={1}
                  max={questionCount}
                  value={range.end}
                  onChange={(v) => updateRange(idx, { end: v ?? questionCount })}
                  style={{ width: 70 }}
                  tabIndex={-1}
                />
                <span style={{ fontSize: 13, color: '#555' }}>배점</span>
                <InputNumber
                  size="small"
                  min={0}
                  value={range.score}
                  onChange={(v) => updateRange(idx, { score: v ?? 0 })}
                  style={{ width: 70 }}
                  tabIndex={-1}
                />
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeRange(idx)}
                  tabIndex={-1}
                />
              </Space>
            ))}
          </Space>
        )}
      </Card>

      {/* 정답지 엑셀 */}
      <Card size="small" title="정답지 엑셀" style={{ marginBottom: 16 }}>
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownload}
          >
            양식 다운로드
          </Button>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              handleUpload(file as unknown as File);
              return false;
            }}
          >
            <Button size="small" icon={<UploadOutlined />} loading={uploading}>
              엑셀 업로드
            </Button>
          </Upload>
        </Space>
        <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
          엑셀 업로드 시 즉시 저장됩니다. 화면에서 수정한 경우에만 아래 저장 버튼을 누르세요.
        </div>
      </Card>

      {/* 문항 그리드 */}
      <div style={{ marginBottom: 8, fontSize: 13, color: '#888' }}>
        문항별 정답 입력. 복수정답은 쉼표 구분 (예: 1,3). 배점 입력 시 문항 override 적용.
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
          const cell = cells[n] ?? { answer: '', multi: false, scoreOverride: null };
          const defaultScore = computeDefaultScore(n, scoreRanges, subjectMaxScore, questionCount);
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
                ref={(el) => { inputRefs.current[n] = el?.input ?? null; }}
                size="small"
                value={cell.answer}
                onChange={(e) => updateCell(n, { answer: e.target.value })}
                onKeyDown={(e) => handleAnswerKeyDown(e, n)}
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
                tabIndex={-1}
              />
              <InputNumber
                size="small"
                min={0}
                value={cell.scoreOverride ?? undefined}
                placeholder={`자동:${defaultScore}`}
                onChange={(v) => updateCell(n, { scoreOverride: v !== null && v !== undefined ? v : null })}
                style={{ width: '100%' }}
                tabIndex={-1}
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
