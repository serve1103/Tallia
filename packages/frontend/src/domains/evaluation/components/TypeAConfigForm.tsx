import { Form, Input, InputNumber, Select, Button, Card, Space, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TypeAConfig, ItemDefinition } from '@tallia/shared';

interface Props {
  value?: TypeAConfig;
  onSave: (config: TypeAConfig) => void;
  loading?: boolean;
}

const emptyItem: ItemDefinition = {
  id: '',
  name: '',
  maxScore: 100,
  weight: 1,
  failThreshold: null,
};

export function TypeAConfigForm({ value, onSave, loading }: Props) {
  const [form] = Form.useForm();

  const handleFinish = (values: { maxCommitteeCount: number; dataType: string; items: Record<string, unknown>[] }) => {
    const config: TypeAConfig = {
      type: 'A',
      maxCommitteeCount: values.maxCommitteeCount,
      dataType: values.dataType as TypeAConfig['dataType'],
      items: values.items.map((item: Record<string, unknown>, idx: number) => ({
        ...item,
        id: item.id || `item-${idx}`,
      })) as ItemDefinition[],
    };
    onSave(config);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={value ?? { maxCommitteeCount: 3, dataType: 'score', items: [emptyItem] }}
      onFinish={handleFinish}
    >
      <Space size="large">
        <Form.Item name="maxCommitteeCount" label="최대 위원 수" rules={[{ required: true }]}>
          <InputNumber min={1} max={20} />
        </Form.Item>
        <Form.Item name="dataType" label="입력 방식" rules={[{ required: true }]}>
          <Select options={[{ label: '점수', value: 'score' }, { label: '등급', value: 'grade' }]} />
        </Form.Item>
      </Space>

      <Divider orientation="left">평가 항목</Divider>

      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <Card key={key} size="small" style={{ marginBottom: 12 }}>
                <Space wrap>
                  <Form.Item {...rest} name={[name, 'name']} label="항목명" rules={[{ required: true }]}>
                    <Input placeholder="항목명" />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'maxScore']} label="만점">
                    <InputNumber min={0} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'weight']} label="가중치">
                    <InputNumber min={0} step={0.1} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'failThreshold']} label="과락 기준">
                    <InputNumber min={0} placeholder="없음" />
                  </Form.Item>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                </Space>
              </Card>
            ))}
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(emptyItem)}>
              항목 추가
            </Button>
          </>
        )}
      </Form.List>

      <Form.Item style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={loading}>
          설정 저장
        </Button>
      </Form.Item>
    </Form>
  );
}
