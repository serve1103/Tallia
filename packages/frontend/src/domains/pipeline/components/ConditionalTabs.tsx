import { Tabs, InputNumber, Space, Typography } from 'antd';
import type { PipelineCondition } from '@tallia/shared';

interface Props {
  conditions: PipelineCondition[];
  activeKey: string;
  onChange: (key: string) => void;
  onConditionCountChange: (index: number, count: number) => void;
}

export function ConditionalTabs({ conditions, activeKey, onChange, onConditionCountChange }: Props) {
  const items = conditions.map((cond, idx) => ({
    key: String(idx),
    label: (
      <Space size={4}>
        <Typography.Text>위원 {cond.committeeCount}명</Typography.Text>
      </Space>
    ),
    children: (
      <div style={{ padding: '8px 0' }}>
        <Space>
          <Typography.Text type="secondary">위원 수:</Typography.Text>
          <InputNumber
            min={1}
            max={20}
            value={cond.committeeCount}
            onChange={(v) => v && onConditionCountChange(idx, v)}
            size="small"
          />
        </Space>
      </div>
    ),
  }));

  return <Tabs activeKey={activeKey} onChange={onChange} items={items} size="small" />;
}
