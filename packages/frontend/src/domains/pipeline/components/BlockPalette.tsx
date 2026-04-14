import { Card, Typography, Tag, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { BlockDefinition, EvaluationType } from '@tallia/shared';
import { getCategoryLabel, getCategoryColor } from '../models/pipeline';

interface Props {
  definitions: BlockDefinition[];
  evalType: EvaluationType;
  onAdd: (type: string) => void;
}

export function BlockPalette({ definitions, evalType, onAdd }: Props) {
  const available = definitions.filter((d) => d.applicableTypes.includes(evalType));

  const grouped = available.reduce(
    (acc, def) => {
      const cat = def.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(def);
      return acc;
    },
    {} as Record<string, BlockDefinition[]>,
  );

  return (
    <div>
      <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
        블록 추가
      </Typography.Text>
      {Object.entries(grouped).map(([category, defs]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <Tag color={getCategoryColor(category as any)} style={{ marginBottom: 8 }}>
            {getCategoryLabel(category as any)}
          </Tag>
          {defs.map((def) => (
            <Card
              key={def.type}
              size="small"
              hoverable
              style={{ marginBottom: 4, cursor: 'pointer' }}
              onClick={() => onAdd(def.type)}
            >
              <Space>
                <PlusOutlined style={{ color: '#a1a1aa', fontSize: 12 }} />
                <Typography.Text style={{ fontSize: 13 }}>{def.name}</Typography.Text>
              </Space>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
