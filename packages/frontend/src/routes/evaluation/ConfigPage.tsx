import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, message, Button, Space, Input } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
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

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

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

  const startEditName = () => {
    setNameDraft(evaluation.name);
    setEditingName(true);
  };

  const cancelEditName = () => {
    setEditingName(false);
    setNameDraft('');
  };

  const submitEditName = async () => {
    const next = nameDraft.trim();
    if (!next) {
      message.error('평가명을 입력하세요');
      return;
    }
    if (next === evaluation.name) {
      setEditingName(false);
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, name: next });
      message.success('평가명이 변경되었습니다');
      setEditingName(false);
    } catch {
      message.error('평가명 변경에 실패했습니다');
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
            evaluationId={id}
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

      {editingName ? (
        <Space.Compact style={{ marginBottom: 4, width: '100%', maxWidth: 520 }}>
          <Input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onPressEnter={submitEditName}
            placeholder="평가명"
            maxLength={100}
          />
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={updateMutation.isPending}
            onClick={submitEditName}
          >
            저장
          </Button>
          <Button icon={<CloseOutlined />} onClick={cancelEditName}>
            취소
          </Button>
        </Space.Compact>
      ) : (
        <Space align="center" style={{ marginBottom: 4 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {evaluation.name}
          </Typography.Title>
          <Button type="text" icon={<EditOutlined />} onClick={startEditName}>
            이름 수정
          </Button>
        </Space>
      )}
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {getEvalTypeLabel(evaluation.type)}
      </Typography.Text>
      <EvaluationTabs evaluationId={id} activeKey="config" />
      {renderForm()}
    </div>
  );
}
