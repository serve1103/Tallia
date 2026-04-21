import { useState, useEffect } from 'react';
import { Drawer, Form, InputNumber, Input, Switch, Select, Button, Typography, Alert, Divider } from 'antd';
import type { BlockDefinition, DecimalConfig, PipelineBlock } from '@tallia/shared';
import { CUSTOM_STEP_TEMPLATES } from '../models/pipeline';

const CUSTOM_GUIDE_MAP = Object.fromEntries(
  CUSTOM_STEP_TEMPLATES.map((t) => [t.blockType, t]),
);

const METHOD_OPTIONS = [
  { label: '반올림', value: 'round' },
  { label: '버림 (절사)', value: 'floor' },
  { label: '올림', value: 'ceil' },
];

const PLACES_OPTIONS = [
  { label: '정수 (0자리)', value: 0 },
  { label: '소수점 1자리', value: 1 },
  { label: '소수점 2자리', value: 2 },
  { label: '소수점 3자리', value: 3 },
];

interface Props {
  block: PipelineBlock | null;
  definition: BlockDefinition | null;
  open: boolean;
  onClose: () => void;
  onSave: (params: Record<string, unknown>) => void;
  onDecimalChange: (decimal: DecimalConfig | null) => void;
}

export function BlockParamEditor({ block, definition, open, onClose, onSave, onDecimalChange }: Props) {
  const [form] = Form.useForm();
  const [decimalEnabled, setDecimalEnabled] = useState(false);
  const [decimalMethod, setDecimalMethod] = useState<DecimalConfig['method']>('round');
  const [decimalPlaces, setDecimalPlaces] = useState<DecimalConfig['places']>(2);

  useEffect(() => {
    if (block?.decimal) {
      setDecimalEnabled(true);
      setDecimalMethod(block.decimal.method);
      setDecimalPlaces(block.decimal.places);
    } else {
      setDecimalEnabled(false);
      setDecimalMethod('round');
      setDecimalPlaces(2);
    }
  }, [block]);

  if (!block || !definition) return null;

  const handleFinish = (values: Record<string, unknown>) => {
    onSave(values);
    onDecimalChange(decimalEnabled ? { method: decimalMethod, places: decimalPlaces } : null);
    onClose();
  };

  return (
    <Drawer
      title={definition.name}
      open={open}
      onClose={onClose}
      width={400}
      extra={
        <Button type="primary" size="small" onClick={() => form.submit()}>
          적용
        </Button>
      }
    >
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
        {definition.inputShape} → {definition.outputShape}
      </Typography.Text>

      {CUSTOM_GUIDE_MAP[definition.type] && (
        <div style={{ marginBottom: 16 }}>
          <Alert
            type="info"
            showIcon={false}
            style={{ background: '#f4f4f5', border: '1px solid #e4e4e7' }}
            message={
              <Typography.Text style={{ fontSize: 12, color: '#52525b' }}>
                {CUSTOM_GUIDE_MAP[definition.type].description}
              </Typography.Text>
            }
            description={
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                예시: {CUSTOM_GUIDE_MAP[definition.type].example}
              </Typography.Text>
            }
          />
          {definition.type === 'custom_formula' && (
            <Alert
              type="warning"
              showIcon={false}
              style={{ marginTop: 8, background: '#fafafa', border: '1px solid #e4e4e7' }}
              message={
                <Typography.Text style={{ fontSize: 12, color: '#52525b' }}>
                  사용 가능한 변수: score, maxScore, count, bonus, weight, min, max, avg, sum
                </Typography.Text>
              }
              description={
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  허용 함수: abs, round, floor, ceil, pow, sqrt, min, max. 그 외 함수/변수는 허용되지 않습니다.
                </Typography.Text>
              }
            />
          )}
        </div>
      )}

      <Form form={form} layout="vertical" initialValues={block.params} onFinish={handleFinish}>
        {definition.params.map((param) => (
          <Form.Item
            key={param.key}
            name={param.key}
            label={param.label}
            rules={param.required ? [{ required: true, message: `${param.label}을(를) 입력하세요` }] : undefined}
          >
            {param.type === 'number' && <InputNumber style={{ width: '100%' }} />}
            {param.type === 'string' && <Input />}
            {param.type === 'boolean' && <Switch />}
            {param.type === 'select' && (
              <Select
                options={param.options?.map((o) => ({ label: o.label, value: o.value }))}
              />
            )}
          </Form.Item>
        ))}
        {definition.params.length === 0 && (
          <Typography.Text type="secondary">이 단계는 설정 가능한 파라미터가 없습니다</Typography.Text>
        )}
      </Form>

      <Divider style={{ margin: '16px 0 12px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Typography.Text strong style={{ fontSize: 13 }}>이 단계만 소수점 처리 재정의</Typography.Text>
        <Switch
          size="small"
          checked={decimalEnabled}
          onChange={setDecimalEnabled}
        />
      </div>
      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
        끄면 평가 공용설정의 기본 소수점을 따릅니다.
      </Typography.Text>
      {decimalEnabled && (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>처리 방식</div>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={decimalMethod}
              options={METHOD_OPTIONS}
              onChange={setDecimalMethod}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>자릿수</div>
            <Select
              size="small"
              style={{ width: '100%' }}
              value={decimalPlaces}
              options={PLACES_OPTIONS}
              onChange={setDecimalPlaces}
            />
          </div>
        </div>
      )}
    </Drawer>
  );
}
