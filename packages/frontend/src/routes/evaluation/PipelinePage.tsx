import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Space, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useEvaluation } from '../../domains/evaluation/hooks/useEvaluations';
import { usePipelineConfig } from '../../domains/pipeline/hooks/usePipeline';
import { PipelineBuilder } from '../../domains/pipeline/components/PipelineBuilder';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';

// Block definitions will come from the backend eventually.
// For now, use an empty array — the BlockPalette will show nothing until definitions are loaded.
const BLOCK_DEFINITIONS: any[] = [];

export function PipelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading } = useEvaluation(id);
  const { data: pipelineConfig, isLoading: pipelineLoading } = usePipelineConfig(id);

  if (isLoading || pipelineLoading) return <Spin />;
  if (!evaluation || !id) return <Typography.Text>평가를 찾을 수 없습니다</Typography.Text>;

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(`/evaluations/${id}/config`)}>
          설정으로
        </Button>
      </Space>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        {evaluation.name}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {getEvalTypeLabel(evaluation.type)} — 파이프라인 설정
      </Typography.Text>
      <PipelineBuilder
        evaluationId={id}
        evalType={evaluation.type}
        initialConfig={pipelineConfig ?? null}
        definitions={BLOCK_DEFINITIONS}
      />
    </div>
  );
}
