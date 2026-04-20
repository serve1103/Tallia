import { Drawer, Form, InputNumber, Input, Switch, Select, Button, Typography, Alert } from 'antd';
import type { BlockDefinition, PipelineBlock } from '@tallia/shared';
import { CUSTOM_STEP_TEMPLATES } from '../models/pipeline';

const CUSTOM_GUIDE_MAP = Object.fromEntries(
  CUSTOM_STEP_TEMPLATES.map((t) => [t.blockType, t]),
);

interface Props {
  block: PipelineBlock | null;
  definition: BlockDefinition | null;
  open: boolean;
  onClose: () => void;
  onSave: (params: Record<string, unknown>) => void;
}

export function BlockParamEditor({ block, definition, open, onClose, onSave }: Props) {
  const [form] = Form.useForm();

  if (!block || !definition) return null;

  const handleFinish = (values: Record<string, unknown>) => {
    onSave(values);
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
          <Typography.Text type="secondary">이 블록은 설정 가능한 파라미터가 없습니다</Typography.Text>
        )}
      </Form>
    </Drawer>
  );
}
