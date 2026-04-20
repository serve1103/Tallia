import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Space, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useEvaluation } from '../../domains/evaluation/hooks/useEvaluations';
import { usePipelineConfig, useBlockDefinitions } from '../../domains/pipeline/hooks/usePipeline';
import { PipelineBuilder } from '../../domains/pipeline/components/PipelineBuilder';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';
import { EvaluationTabs } from '../../shared/components/EvaluationTabs';

export function PipelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading } = useEvaluation(id);
  const { data: pipelineConfig, isLoading: pipelineLoading } = usePipelineConfig(id);
  const { data: definitions, isLoading: defsLoading } = useBlockDefinitions(id);

  if (isLoading || pipelineLoading || defsLoading) return <Spin />;
  if (!evaluation || !id) return <Typography.Text>평가를 찾을 수 없습니다</Typography.Text>;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/dashboard')}>
          목록으로
        </Button>
      </Space>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        {evaluation.name}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {getEvalTypeLabel(evaluation.type)}
      </Typography.Text>
      <EvaluationTabs evaluationId={id} activeKey="pipeline" />
      <PipelineBuilder
        evaluationId={id}
        evalType={evaluation.type}
        initialConfig={pipelineConfig ?? null}
        definitions={definitions ?? []}
      />
    </div>
  );
}
