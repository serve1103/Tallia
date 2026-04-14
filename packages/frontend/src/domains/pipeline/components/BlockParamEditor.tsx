import { Drawer, Form, InputNumber, Input, Switch, Select, Button, Typography } from 'antd';
import type { BlockDefinition, PipelineBlock } from '@tallia/shared';

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
