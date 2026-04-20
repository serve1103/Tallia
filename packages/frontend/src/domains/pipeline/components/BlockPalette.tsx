import { useState } from 'react';
import { Card, Typography, Tag, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { BlockDefinition, BlockCategory, EvaluationType } from '@tallia/shared';
import { getCategoryLabel, getCategoryColor } from '../models/pipeline';
import { CustomStepTemplateModal } from './CustomStepTemplateModal';

const CUSTOM_BLOCK_TYPES = new Set([
  'custom_bonus',
  'custom_ratio',
  'custom_range_map',
  'custom_clamp',
  'custom_formula',
]);

interface Props {
  definitions: BlockDefinition[];
  evalType: EvaluationType;
  onAdd: (type: string, initialParams?: Record<string, unknown>) => void;
}

export function BlockPalette({ definitions, evalType, onAdd }: Props) {
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const available = definitions.filter(
    (d) => d.applicableTypes.includes(evalType) && !CUSTOM_BLOCK_TYPES.has(d.type),
  );

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
      {(Object.keys(grouped) as BlockCategory[]).map((category) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <Tag color={getCategoryColor(category)} style={{ marginBottom: 8 }}>
            {getCategoryLabel(category)}
          </Tag>
          {grouped[category].map((def) => (
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

      <div style={{ marginTop: 8 }}>
        <Card
          size="small"
          hoverable
          style={{
            cursor: 'pointer',
            border: '1.5px dashed #d4d4d8',
            background: '#fafafa',
          }}
          onClick={() => setTemplateModalOpen(true)}
        >
          <Space>
            <PlusOutlined style={{ color: '#71717a', fontSize: 12 }} />
            <Typography.Text style={{ fontSize: 13, color: '#52525b' }}>
              사용자 정의 단계 추가
            </Typography.Text>
          </Space>
        </Card>
      </div>

      <CustomStepTemplateModal
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        onSelect={(blockType, initialParams) => onAdd(blockType, initialParams)}
      />
    </div>
  );
}
