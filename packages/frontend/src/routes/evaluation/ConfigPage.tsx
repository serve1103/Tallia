import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, message, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { EvaluationTabs } from '../../shared/components/EvaluationTabs';
import {
  useEvaluation,
  useEvalConfig,
  useSaveEvalConfig,
  useUpdateEvaluation,
} from '../../domains/evaluation/hooks/useEvaluations';
import { TypeAConfigForm } from '../../domains/evaluation/components/TypeAConfigForm';
import { TypeBConfigForm } from '../../domains/evaluation/components/TypeBConfigForm';
import { TypeCConfigForm } from '../../domains/evaluation/components/TypeCConfigForm';
import { TypeDConfigForm } from '../../domains/evaluation/components/TypeDConfigForm';
import {
  DEFAULT_COMMON_SETTINGS,
  type CommonSettings,
} from '../../domains/evaluation/components/CommonSettingsCard';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';

export function ConfigPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading } = useEvaluation(id);
  const { data: config, isLoading: configLoading } = useEvalConfig(id);
  const saveMutation = useSaveEvalConfig();
  const updateMutation = useUpdateEvaluation();

  if (isLoading || configLoading) return <Spin />;
  if (!evaluation || !id) return <Typography.Text>평가를 찾을 수 없습니다</Typography.Text>;

  const initialSettings: CommonSettings = {
    convertedMax: evaluation.convertedMax ?? DEFAULT_COMMON_SETTINGS.convertedMax,
    defaultDecimal: evaluation.defaultDecimal ?? DEFAULT_COMMON_SETTINGS.defaultDecimal,
    blockOverrides: DEFAULT_COMMON_SETTINGS.blockOverrides,
  };

  const handleSave = async (newConfig: unknown, commonSettings: CommonSettings) => {
    try {
      await Promise.all([
        saveMutation.mutateAsync({ id, config: newConfig }),
        updateMutation.mutateAsync({
          id,
          convertedMax: commonSettings.convertedMax,
          defaultDecimal: commonSettings.defaultDecimal,
        }),
      ]);
      message.success('설정이 저장되었습니다');
    } catch {
      message.error('저장에 실패했습니다');
    }
  };

  const renderForm = () => {
    const loading = saveMutation.isPending || updateMutation.isPending;
    switch (evaluation.type) {
      case 'A':
        return (
          <TypeAConfigForm
            value={config?.type === 'A' ? config : undefined}
            commonSettings={initialSettings}
            onSave={handleSave}
            loading={loading}
          />
        );
      case 'B':
        return (
          <TypeBConfigForm
            evaluationId={id}
            value={config?.type === 'B' ? config : undefined}
            commonSettings={initialSettings}
            onSave={handleSave}
            loading={loading}
          />
        );
      case 'C':
        return (
          <TypeCConfigForm
            value={config?.type === 'C' ? config : undefined}
            commonSettings={initialSettings}
            onSave={handleSave}
            loading={loading}
          />
        );
      case 'D':
        return (
          <TypeDConfigForm
            value={config?.type === 'D' ? config : undefined}
            commonSettings={initialSettings}
            onSave={handleSave}
            loading={loading}
          />
        );
    }
  };

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
      <EvaluationTabs evaluationId={id} activeKey="config" />
      {renderForm()}
    </div>
  );
}
