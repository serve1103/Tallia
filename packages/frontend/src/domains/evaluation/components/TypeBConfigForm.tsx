import { Form, InputNumber, Button, Card, Space, Divider, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TypeBConfig, SubjectDef } from '@tallia/shared';

interface Props {
  value?: TypeBConfig;
  onSave: (config: TypeBConfig) => void;
  loading?: boolean;
}

const emptySubject: Omit<SubjectDef, 'examTypes' | 'questionErrors'> = {
  id: '',
  name: '',
  questionCount: 0,
  maxScore: 100,
  failThreshold: null,
};

export function TypeBConfigForm({ value, onSave, loading }: Props) {
  const [form] = Form.useForm();

  const handleFinish = (values: { subjects: Record<string, unknown>[]; totalFailThreshold?: number | null }) => {
    const config: TypeBConfig = {
      type: 'B',
      subjects: values.subjects.map((s: Record<string, unknown>, idx: number) => ({
        ...s,
        id: s.id || `subj-${idx}`,
        examTypes: (s.examTypes as unknown[]) ?? [],
        questionErrors: (s.questionErrors as unknown[]) ?? [],
      })),
      totalFailThreshold: values.totalFailThreshold ?? null,
    };
    onSave(config);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={value ?? { subjects: [emptySubject], totalFailThreshold: null }}
      onFinish={handleFinish}
    >
      <Form.Item name="totalFailThreshold" label="전체 과락 기준">
        <InputNumber min={0} placeholder="없음" style={{ width: 200 }} />
      </Form.Item>

      <Divider orientation="left">과목</Divider>

      <Form.List name="subjects">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <Card key={key} size="small" style={{ marginBottom: 12 }}>
                <Space wrap>
                  <Form.Item {...rest} name={[name, 'name']} label="과목명" rules={[{ required: true }]}>
                    <Input placeholder="과목명" />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'questionCount']} label="문항 수">
                    <InputNumber min={1} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'maxScore']} label="만점">
                    <InputNumber min={0} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'failThreshold']} label="과락 기준">
                    <InputNumber min={0} placeholder="없음" />
                  </Form.Item>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                </Space>
              </Card>
            ))}
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(emptySubject)}>
              과목 추가
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
