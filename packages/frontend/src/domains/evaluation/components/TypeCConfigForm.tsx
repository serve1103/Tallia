import { useState } from 'react';
import { Form, InputNumber, Button, Card, Space, Divider, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TypeCConfig, QuestionDef } from '@tallia/shared';
import { CommonSettingsCard, DEFAULT_COMMON_SETTINGS } from './CommonSettingsCard';
import type { CommonSettings } from './CommonSettingsCard';

interface Props {
  value?: TypeCConfig;
  commonSettings?: CommonSettings;
  onSave: (config: TypeCConfig, commonSettings: CommonSettings) => void;
  loading?: boolean;
}

const emptyQuestion: Omit<QuestionDef, 'subQuestions'> = {
  id: '',
  name: '',
  maxScore: 100,
  weight: 1,
  failThreshold: null,
};

export function TypeCConfigForm({ value, commonSettings, onSave, loading }: Props) {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<CommonSettings>(commonSettings ?? DEFAULT_COMMON_SETTINGS);

  const handleFinish = (values: { committeeCount: number; questions: Record<string, unknown>[]; totalFailThreshold?: number | null }) => {
    const config: TypeCConfig = {
      type: 'C',
      committeeCount: values.committeeCount,
      questions: values.questions.map((q: Record<string, unknown>, idx: number) => ({
        ...q,
        id: q.id || `q-${idx}`,
        subQuestions: (q.subQuestions as unknown[]) ?? [],
      })) as QuestionDef[],
      totalFailThreshold: values.totalFailThreshold ?? null,
    };
    onSave(config, settings);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={value ?? { committeeCount: 2, questions: [emptyQuestion], totalFailThreshold: null }}
      onFinish={handleFinish}
    >
      <Space size="large">
        <Form.Item name="committeeCount" label="채점위원 수" rules={[{ required: true }]}>
          <InputNumber min={1} max={10} />
        </Form.Item>
        <Form.Item name="totalFailThreshold" label="전체 과락 기준">
          <InputNumber min={0} placeholder="없음" />
        </Form.Item>
      </Space>

      <Divider orientation="left">문항</Divider>

      <Form.List name="questions">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => (
              <Card key={key} size="small" style={{ marginBottom: 12 }}>
                <Space wrap>
                  <Form.Item {...rest} name={[name, 'name']} label="문항명" rules={[{ required: true }]}>
                    <Input placeholder="문항명" />
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
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(emptyQuestion)}>
              문항 추가
            </Button>
          </>
        )}
      </Form.List>

      <CommonSettingsCard value={settings} onChange={setSettings} />

      <Form.Item style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={loading}>
          설정 저장
        </Button>
      </Form.Item>
    </Form>
  );
}
