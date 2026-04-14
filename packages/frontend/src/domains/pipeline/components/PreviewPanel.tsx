import { Card, Button, Typography, Input, Spin, Alert, message } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { PipelineBlock } from '@tallia/shared';
import { usePreviewPipeline } from '../hooks/usePipeline';

interface Props {
  evaluationId: string;
  blocks: PipelineBlock[];
}

export function PreviewPanel({ evaluationId, blocks }: Props) {
  const [sampleInput, setSampleInput] = useState('{}');
  const previewMutation = usePreviewPipeline(evaluationId);

  const handlePreview = () => {
    try {
      const sampleData = JSON.parse(sampleInput);
      previewMutation.mutate({ blocks, sampleData });
    } catch {
      message.error('JSON 형식이 올바르지 않습니다');
    }
  };

  return (
    <Card size="small" title="샘플 미리보기">
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
        샘플 데이터 (JSON)
      </Typography.Text>
      <Input.TextArea
        rows={3}
        value={sampleInput}
        onChange={(e) => setSampleInput(e.target.value)}
        style={{ marginBottom: 8, fontFamily: 'monospace', fontSize: 12 }}
      />
      <Button
        size="small"
        icon={<PlayCircleOutlined />}
        onClick={handlePreview}
        loading={previewMutation.isPending}
        disabled={blocks.length === 0}
      >
        실행
      </Button>

      {previewMutation.data && (
        <div style={{ marginTop: 12 }}>
          <Typography.Text strong style={{ fontSize: 12 }}>결과:</Typography.Text>
          <pre style={{ background: '#f8f8fa', padding: 8, borderRadius: 4, fontSize: 12, marginTop: 4 }}>
            {JSON.stringify(previewMutation.data.result, null, 2)}
          </pre>
        </div>
      )}

      {previewMutation.isError && (
        <Alert type="error" message="미리보기 실패" style={{ marginTop: 8 }} />
      )}
    </Card>
  );
}
