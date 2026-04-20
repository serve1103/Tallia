import { Card, Button, Alert, Table, Tag, Typography, Divider, Empty } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usePreviewPipeline } from '../hooks/usePipeline';
import type { PreviewResult } from '../api/pipeline';

interface Props {
  evaluationId: string;
}

interface StepRow {
  key: number;
  blockIndex: number;
  label: string;
  blockType: string;
  output: string;
}

export function PreviewPanel({ evaluationId }: Props) {
  const previewMutation = usePreviewPipeline(evaluationId);

  const handlePreview = () => {
    previewMutation.mutate();
  };

  const result: PreviewResult | undefined = previewMutation.data;

  const stepColumns: ColumnsType<StepRow> = [
    {
      title: '단계',
      dataIndex: 'blockIndex',
      key: 'blockIndex',
      width: 60,
      render: (v: number) => <Tag>{v + 1}</Tag>,
    },
    {
      title: '블록',
      dataIndex: 'label',
      key: 'label',
      width: 160,
    },
    {
      title: '출력',
      dataIndex: 'output',
      key: 'output',
      render: (v: string) => (
        <Typography.Text code style={{ fontSize: 12 }}>
          {v}
        </Typography.Text>
      ),
    },
  ];

  const stepRows: StepRow[] =
    result?.intermediateResults?.map((r) => ({
      key: r.blockIndex,
      blockIndex: r.blockIndex,
      label: r.label,
      blockType: r.blockType,
      output: JSON.stringify(r.output),
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
        <Empty description="'샘플 미리보기 실행' 버튼을 눌러 파이프라인을 테스트하세요" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {previewMutation.isError && (
        <Alert type="error" message="미리보기 요청 실패" description="서버 연결을 확인하세요" showIcon />
      )}

      {result?.errorMessage && (
        <Alert
          type="warning"
          message="파이프라인 실행 오류"
          description={result.errorMessage}
          showIcon
          icon={<WarningOutlined />}
        />
      )}

      {result && !result.errorMessage && (
        <>
          {/* 샘플 입력 */}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            샘플 입력
          </Typography.Text>
          <pre
            style={{
              background: '#f8f8fa',
              padding: 8,
              borderRadius: 4,
              fontSize: 11,
              marginTop: 4,
              marginBottom: 12,
              maxHeight: 120,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(result.sampleInput, null, 2)}
          </pre>

          {/* 단계별 중간 결과 */}
          {stepRows.length > 0 && (
            <>
              <Typography.Text strong style={{ fontSize: 12 }}>
                단계별 결과
              </Typography.Text>
              <Table<StepRow>
                size="small"
                columns={stepColumns}
                dataSource={stepRows}
                pagination={false}
                style={{ marginTop: 6, marginBottom: 12 }}
              />
            </>
          )}

          {/* 최종 점수 */}
          {finalScore != null && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Typography.Text strong>최종 점수:</Typography.Text>
                <Typography.Text
                  strong
                  style={{ fontSize: 18, color: '#18181b' }}
                >
                  {finalScore}
                </Typography.Text>
              </div>
            </>
          )}

          {/* 과락 플래그 */}
          {result.failFlags && result.failFlags.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Typography.Text strong style={{ fontSize: 12 }}>
                과락 항목
              </Typography.Text>
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {result.failFlags.map((f, i) => (
                  <Tag key={i} color="error">
                    {f.name}: {f.value} (기준 {f.threshold})
                  </Tag>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
