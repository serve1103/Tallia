import { Card, Button, Alert, Typography, Divider, Empty, Descriptions } from 'antd';
import { StatusTag } from '../../../shared/components/StatusTag';
import { PlayCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { usePreviewPipeline, useBlockDefinitions } from '../hooks/usePipeline';
import type { PreviewResult } from '../api/pipeline';
import { IntermediateStepsView, type IntermediateStep } from '../../../shared/components/IntermediateSteps';
import { formatNumber } from '../../../shared/lib/format';

interface Props {
  evaluationId: string;
}

/** 샘플 입력을 사람이 읽을 수 있게 요약. 유형별 shape 에 맞춰 포맷. */
function SampleInputView({ input }: { input: unknown }) {
  if (input == null) return <Typography.Text type="secondary">샘플 입력 없음</Typography.Text>;

  // B유형: { subjects: [{ subjectId, examType, answers: {1: '3', ...} }] }
  if (typeof input === 'object' && 'subjects' in input) {
    const data = input as { subjects: Array<{ subjectId: string; examType: string; answers: Record<string, string> }> };
    if (Array.isArray(data.subjects) && data.subjects.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.subjects.map((s, i) => {
            const entries = Object.entries(s.answers ?? {}).sort(
              (a, b) => Number(a[0]) - Number(b[0]),
            );
            return (
              <Descriptions key={i} size="small" bordered column={1}>
                <Descriptions.Item label="과목 ID">{s.subjectId}</Descriptions.Item>
                <Descriptions.Item label="시험유형">{s.examType || '-'}</Descriptions.Item>
                <Descriptions.Item label={`응답 (${entries.length}문항)`}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                      gap: 4,
                    }}
                  >
                    {entries.map(([qNo, ans]) => (
                      <div
                        key={qNo}
                        style={{
                          fontSize: 11,
                          padding: '2px 4px',
                          textAlign: 'center',
                          background: '#fafafa',
                          borderRadius: 4,
                        }}
                      >
                        <span style={{ color: '#888' }}>Q{qNo}</span>{' '}
                        <strong>{String(ans)}</strong>
                      </div>
                    ))}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            );
          })}
        </div>
      );
    }
  }

  // A유형: { items: [...], data: number[][] }
  if (typeof input === 'object' && 'items' in input && 'data' in input) {
    const data = input as { items: string[]; data: number[][] };
    return (
      <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: '4px 8px', background: '#f5f5f5', textAlign: 'left' }}>항목</th>
            {data.data[0]?.map((_, i) => (
              <th key={i} style={{ padding: '4px 8px', background: '#f5f5f5' }}>위원{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.items.map((name, r) => (
            <tr key={name}>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>{name}</td>
              {data.data[r]?.map((v, c) => (
                <td key={c} style={{ padding: '4px 8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // 그 외: pretty JSON fallback
  return (
    <pre style={{ fontSize: 11, background: '#fafafa', padding: 8, borderRadius: 4, margin: 0, overflow: 'auto' }}>
      {JSON.stringify(input, null, 2)}
    </pre>
  );
}

export function PreviewPanel({ evaluationId }: Props) {
  const previewMutation = usePreviewPipeline(evaluationId);
  const { data: definitions } = useBlockDefinitions(evaluationId);

  const handlePreview = () => {
    previewMutation.mutate();
  };

  const result: PreviewResult | undefined = previewMutation.data;

  const steps: IntermediateStep[] =
    result?.intermediateResults?.map((r) => ({
      blockIndex: r.blockIndex,
      blockType: r.blockType,
      label: r.label,
      output: r.output,
    })) ?? [];

  const finalScore =
    result?.finalData != null && typeof result.finalData === 'object' && 'value' in (result.finalData as object)
      ? (result.finalData as { value: number }).value
      : typeof result?.finalData === 'number'
        ? result.finalData
        : null;

  return (
    <Card
      size="small"
      title="샘플 미리보기"
      extra={
        <Button
          size="small"
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handlePreview}
          loading={previewMutation.isPending}
        >
          샘플 미리보기 실행
        </Button>
      }
    >
      {!result && !previewMutation.isPending && !previewMutation.isError && (
        <Empty description="'샘플 미리보기 실행' 버튼을 눌러 계산 순서를 테스트하세요" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {previewMutation.isError && (
        <Alert type="error" message="미리보기 요청 실패" description="서버 연결을 확인하세요" showIcon />
      )}

      {result?.errorMessage && (
        <Alert
          type="warning"
          message="계산 오류"
          description={result.errorMessage}
          showIcon
          icon={<WarningOutlined />}
        />
      )}

      {result && !result.errorMessage && (
        <>
          <Typography.Text strong style={{ fontSize: 12 }}>
            샘플 입력
          </Typography.Text>
          <div style={{ marginTop: 6, marginBottom: 16 }}>
            <SampleInputView input={result.sampleInput} />
          </div>

          {steps.length > 0 && (
            <>
              <Typography.Text strong style={{ fontSize: 12 }}>
                단계별 결과
              </Typography.Text>
              <div style={{ marginTop: 6, marginBottom: 12 }}>
                <IntermediateStepsView steps={steps} definitions={definitions} />
              </div>
            </>
          )}

          {finalScore != null && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Typography.Text strong>최종 점수:</Typography.Text>
                <Typography.Text strong style={{ fontSize: 18, color: '#18181b' }}>
                  {formatNumber(finalScore)}
                </Typography.Text>
              </div>
            </>
          )}

          {result.failFlags && result.failFlags.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Typography.Text strong style={{ fontSize: 12 }}>
                과락 항목
              </Typography.Text>
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.failFlags.map((f, i) => (
                  <StatusTag key={i} variant="error">
                    {f.name}: {f.value} (기준 {f.threshold})
                  </StatusTag>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
