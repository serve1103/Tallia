import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, message, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useEvaluation, useEvalConfig, useSaveEvalConfig } from '../../domains/evaluation/hooks/useEvaluations';
import { TypeAConfigForm } from '../../domains/evaluation/components/TypeAConfigForm';
import { TypeBConfigForm } from '../../domains/evaluation/components/TypeBConfigForm';
import { TypeCConfigForm } from '../../domains/evaluation/components/TypeCConfigForm';
import { TypeDConfigForm } from '../../domains/evaluation/components/TypeDConfigForm';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';

export function ConfigPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading } = useEvaluation(id);
  const { data: config, isLoading: configLoading } = useEvalConfig(id);
  const saveMutation = useSaveEvalConfig();

  if (isLoading || configLoading) return <Spin />;
  if (!evaluation || !id) return <Typography.Text>평가를 찾을 수 없습니다</Typography.Text>;

  const handleSave = (newConfig: unknown) => {
    saveMutation.mutate(
      { id, config: newConfig },
      {
        onSuccess: () => message.success('설정이 저장되었습니다'),
        onError: () => message.error('저장에 실패했습니다'),
      },
    );
  };

  const renderForm = () => {
    switch (evaluation.type) {
      case 'A':
        return <TypeAConfigForm value={config?.type === 'A' ? config : undefined} onSave={handleSave} loading={saveMutation.isPending} />;
      case 'B':
        return <TypeBConfigForm value={config?.type === 'B' ? config : undefined} onSave={handleSave} loading={saveMutation.isPending} />;
      case 'C':
        return <TypeCConfigForm value={config?.type === 'C' ? config : undefined} onSave={handleSave} loading={saveMutation.isPending} />;
      case 'D':
        return <TypeDConfigForm value={config?.type === 'D' ? config : undefined} onSave={handleSave} loading={saveMutation.isPending} />;
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/dashboard')}>
          목록으로
        </Button>
      </Space>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        {evaluation.name}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {getEvalTypeLabel(evaluation.type)} 설정
      </Typography.Text>
      {renderForm()}
    </div>
  );
}
