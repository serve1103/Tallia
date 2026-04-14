import { Form, InputNumber, Select, Button, Space, Divider, Input, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TypeDConfig, ColumnDef } from '@tallia/shared';

interface Props {
  value?: TypeDConfig;
  onSave: (config: TypeDConfig) => void;
  loading?: boolean;
}

const MAPPING_TYPE_OPTIONS = [
  { label: '자격증', value: 'certificate' },
  { label: '어학시험', value: 'language_test' },
  { label: '편입 GPA', value: 'transfer_gpa' },
  { label: '성적', value: 'achievement' },
  { label: '사용자 정의', value: 'custom' },
];

const emptyColumn: ColumnDef = { key: '', label: '', type: 'text' };

export function TypeDConfigForm({ value, onSave, loading }: Props) {
  const [form] = Form.useForm();

  const handleFinish = (values: { mappingType: string; inputColumns: Record<string, unknown>[]; maxScore: number; totalFailThreshold?: number | null }) => {
    const config: TypeDConfig = {
      type: 'D',
      mappingType: values.mappingType as TypeDConfig['mappingType'],
      inputColumns: values.inputColumns.map((c: Record<string, unknown>, idx: number) => ({
        ...c,
        key: (c.key as string) || `col-${idx}`,
      })) as ColumnDef[],
      maxScore: values.maxScore,
      totalFailThreshold: values.totalFailThreshold ?? null,
    };
    onSave(config);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={value ?? { mappingType: 'certificate', maxScore: 100, inputColumns: [emptyColumn], totalFailThreshold: null }}
      onFinish={handleFinish}
    >
      <Space size="large">
        <Form.Item name="mappingType" label="변환표 유형" rules={[{ required: true }]}>
          <Select options={MAPPING_TYPE_OPTIONS} style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="maxScore" label="환산 만점" rules={[{ required: true }]}>
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item name="totalFailThreshold" label="과락 기준">
          <InputNumber min={0} placeholder="없음" />
        </Form.Item>
      </Space>

      <Divider orientation="left">입력 컬럼 정의</Divider>

      <Form.List name="inputColumns">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <Card key={key} size="small" style={{ marginBottom: 12 }}>
                <Space wrap>
                  <Form.Item {...rest} name={[name, 'key']} label="키" rules={[{ required: true }]}>
                    <Input placeholder="score" />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'label']} label="라벨" rules={[{ required: true }]}>
                    <Input placeholder="점수" />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'type']} label="타입">
                    <Select options={[{ label: '텍스트', value: 'text' }, { label: '숫자', value: 'number' }]} style={{ width: 120 }} />
                  </Form.Item>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                </Space>
              </Card>
            ))}
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(emptyColumn)}>
              컬럼 추가
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
