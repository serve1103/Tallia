import { Collapse, Table, Tooltip, Typography, Empty } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { BlockDefinition } from '@tallia/shared';
import { formatNumber } from '../lib/format';
import { getCategoryLabel, getCategoryVariant } from '../lib/block-category';
import { StatusTag, type StatusVariant } from './StatusTag';

export interface IntermediateStep {
  blockIndex: number;
  blockType: string;
  label: string;
  output: unknown;
}

interface ScalarOutput { value: number }
interface SubjectScore { id?: string; name?: string; score: number }
interface SubjectScoresOutput { subjects: SubjectScore[] }
interface QuestionScore {
  qNo: number;
  correct: boolean;
  score: number;
  __subjectId?: string;
  errorHandling?: 'all_correct' | 'exclude';
}
interface QuestionScoresOutput { scores: QuestionScore[] }
interface CommitteeScore { committeeNo?: number; name?: string; score?: number; average?: number }
interface CommitteeOutput { committees: CommitteeScore[] }

function isScalar(v: unknown): v is ScalarOutput {
  return typeof v === 'object' && v !== null && 'value' in v && typeof (v as ScalarOutput).value === 'number';
}
function isSubjectScores(v: unknown): v is SubjectScoresOutput {
  return typeof v === 'object' && v !== null && Array.isArray((v as SubjectScoresOutput).subjects);
}
function isQuestionScores(v: unknown): v is QuestionScoresOutput {
  return typeof v === 'object' && v !== null && Array.isArray((v as QuestionScoresOutput).scores);
}
function isCommittees(v: unknown): v is CommitteeOutput {
  return typeof v === 'object' && v !== null && Array.isArray((v as CommitteeOutput).committees);
}

function stepSummary(output: unknown): { text: string; variant: StatusVariant } | null {
  if (isScalar(output)) {
    return { text: `${formatNumber(output.value)} 점`, variant: 'info' };
  }
  if (isQuestionScores(output)) {
    const total = output.scores.length;
    const correct = output.scores.filter((s) => s.correct).length;
    const sum = output.scores.reduce((a, b) => a + b.score, 0);
    const errorCount = output.scores.filter((s) => s.errorHandling).length;
    const suffix = errorCount > 0 ? ` · 오류 ${errorCount}` : '';
    return {
      text: `${correct}/${total} 정답 · ${formatNumber(sum)}점${suffix}`,
      variant: correct > 0 ? 'success' : 'neutral',
    };
  }
  if (isSubjectScores(output)) {
    const sum = output.subjects.reduce((a, b) => a + b.score, 0);
    return { text: `${output.subjects.length}과목 · 합 ${formatNumber(sum)}점`, variant: 'info' };
  }
  if (isCommittees(output)) {
    return { text: `위원 ${output.committees.length}명`, variant: 'info' };
  }
  return null;
}

function QuestionScoresView({ output }: { output: QuestionScoresOutput }) {
  const bySubject: Record<string, QuestionScore[]> = {};
  for (const s of output.scores) {
    const key = s.__subjectId ?? '_';
    (bySubject[key] ??= []).push(s);
  }
  const groups = Object.entries(bySubject);

  const cellStyle = (s: QuestionScore): { border: string; background: string } => {
    if (s.errorHandling === 'all_correct') return { border: '1px solid #faad14', background: '#fffbe6' };
    if (s.errorHandling === 'exclude') return { border: '1px solid #d9d9d9', background: '#fafafa' };
    if (s.correct) return { border: '1px solid #52c41a', background: '#f6ffed' };
    return { border: '1px solid #ffccc7', background: '#fff1f0' };
  };

  const inlineMarker = (s: QuestionScore) => {
    if (s.errorHandling === 'all_correct') {
      return (
        <Tooltip title="전원 정답 처리">
          <span style={{ width: 8, height: 8, borderRadius: 4, background: '#faad14', display: 'inline-block' }} />
        </Tooltip>
      );
    }
    if (s.errorHandling === 'exclude') {
      return (
        <Tooltip title="배점 제외">
          <span style={{ width: 8, height: 8, borderRadius: 4, background: '#8c8c8c', display: 'inline-block' }} />
        </Tooltip>
      );
    }
    return null;
  };

  const renderGrid = (items: QuestionScore[]) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))',
        gap: 6,
      }}
    >
      {items.map((s) => {
        const cs = cellStyle(s);
        return (
          <div
            key={s.qNo}
            style={{ ...cs, borderRadius: 6, padding: '4px 6px', textAlign: 'center', fontSize: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#555' }}>
              <span>Q{s.qNo}</span>
              {s.errorHandling
                ? inlineMarker(s)
                : s.correct
                  ? <CheckOutlined style={{ color: '#52c41a' }} />
                  : <CloseOutlined style={{ color: '#ff4d4f' }} />}
            </div>
            <div style={{ fontWeight: 600 }}>{formatNumber(s.score)}</div>
          </div>
        );
      })}
    </div>
  );

  const hasErrors = output.scores.some((s) => s.errorHandling);
  const legend = hasErrors ? (
    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#555', marginBottom: 6 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: '#faad14', display: 'inline-block' }} />
        전원 정답
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: '#8c8c8c', display: 'inline-block' }} />
        배점 제외
      </span>
    </div>
  ) : null;

  if (groups.length === 1) {
    return (
      <div>
        {legend}
        {renderGrid(groups[0][1])}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {legend}
      {groups.map(([subjectId, items], idx) => (
        <div key={subjectId}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 4 }}>
            과목 {idx + 1}
          </div>
          {renderGrid(items)}
        </div>
      ))}
    </div>
  );
}

function SubjectScoresView({ output }: { output: SubjectScoresOutput }) {
  return (
    <Table
      size="small"
      pagination={false}
      dataSource={output.subjects.map((s, i) => ({ ...s, key: s.id ?? i }))}
      columns={[
        { title: '과목', dataIndex: 'name', key: 'name' },
        {
          title: '점수',
          dataIndex: 'score',
          key: 'score',
          align: 'right',
          render: (v: number) => <strong>{formatNumber(v)}</strong>,
        },
      ]}
    />
  );
}

function CommitteesView({ output }: { output: CommitteeOutput }) {
  return (
    <Table
      size="small"
      pagination={false}
      dataSource={output.committees.map((c, i) => ({ ...c, key: i }))}
      columns={[
        { title: '위원', dataIndex: 'committeeNo', key: 'committeeNo', render: (v, r) => v ?? (r as CommitteeScore).name ?? '-' },
        { title: '점수', dataIndex: 'score', key: 'score', align: 'right', render: (v: number) => formatNumber(v) },
        { title: '평균', dataIndex: 'average', key: 'average', align: 'right', render: (v: number) => formatNumber(v) },
      ]}
    />
  );
}

function StepContent({ output }: { output: unknown }) {
  if (isScalar(output)) {
    return (
      <div style={{ fontSize: 32, fontWeight: 700, color: '#18181b' }}>
        {formatNumber(output.value)}
        <Typography.Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>점</Typography.Text>
      </div>
    );
  }
  if (isQuestionScores(output)) {
    if (output.scores.length === 0) return <Empty description="채점된 문항 없음" />;
    return <QuestionScoresView output={output} />;
  }
  if (isSubjectScores(output)) return <SubjectScoresView output={output} />;
  if (isCommittees(output)) return <CommitteesView output={output} />;
  return (
    <pre style={{ fontSize: 12, background: '#fafafa', padding: 8, borderRadius: 4, overflow: 'auto', margin: 0 }}>
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}

interface Props {
  steps: IntermediateStep[];
  /** 있으면 step의 category 태그를 팔레트와 동일한 스타일로 표시. */
  definitions?: BlockDefinition[];
  defaultAllOpen?: boolean;
}

/** 파이프라인 중간 결과를 유저 친화적으로 표시. IntermediateDetail / PreviewPanel 공용. */
export function IntermediateStepsView({ steps, definitions, defaultAllOpen = true }: Props) {
  if (steps.length === 0) return <Empty description="계산 이력 없음" />;

  const defMap = new Map<string, BlockDefinition>();
  for (const d of definitions ?? []) defMap.set(d.type, d);

  return (
    <Collapse
      size="small"
      defaultActiveKey={defaultAllOpen ? steps.map((s) => String(s.blockIndex)) : []}
      items={steps.map((step) => {
        const summary = stepSummary(step.output);
        const def = defMap.get(step.blockType);
        const category = def?.category;
        const indexTag = (
          <StatusTag variant="neutral" style={{ margin: 0, fontFamily: 'monospace', minWidth: 28, textAlign: 'center' }}>
            {step.blockIndex + 1}
          </StatusTag>
        );
        const categoryTag = category ? (
          <StatusTag variant={getCategoryVariant(category, step.blockType)}>
            {getCategoryLabel(category, step.blockType)}
          </StatusTag>
        ) : null;
        return {
          key: String(step.blockIndex),
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {indexTag}
              {categoryTag}
              <Tooltip title={step.blockType} mouseEnterDelay={0.3}>
                <strong>{step.label}</strong>
              </Tooltip>
              {summary && (
                <StatusTag variant={summary.variant} style={{ marginLeft: 'auto' }}>
                  {summary.text}
                </StatusTag>
              )}
            </div>
          ),
          children: <StepContent output={step.output} />,
        };
      })}
    />
  );
}
