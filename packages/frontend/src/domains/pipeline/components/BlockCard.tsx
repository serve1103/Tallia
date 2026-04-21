import { Card, Button, Space, Typography, theme } from 'antd';
import { DeleteOutlined, SettingOutlined, HolderOutlined } from '@ant-design/icons';
import type { PipelineBlock, BlockDefinition } from '@tallia/shared';
import { getCategoryLabel, getCategoryVariant } from '../models/pipeline';
import { StatusTag } from '../../../shared/components/StatusTag';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  block: PipelineBlock;
  index: number;
  definition?: BlockDefinition;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function BlockCard({ block, index, definition, isSelected, onSelect, onRemove }: Props) {
  const { token } = theme.useToken();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `block-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        size="small"
        style={{
          marginBottom: 8,
          borderColor: isSelected ? '#18181b' : undefined,
          cursor: 'pointer',
        }}
        onClick={onSelect}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span {...listeners} style={{ cursor: 'grab' }}>
              <HolderOutlined style={{ color: token.colorTextTertiary }} />
            </span>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {definition?.name ?? block.type}
            </Typography.Text>
            {definition && (
              <StatusTag
                variant={getCategoryVariant(definition.category, definition.type)}
                style={{ fontSize: 11 }}
              >
                {getCategoryLabel(definition.category, definition.type)}
              </StatusTag>
            )}
          </Space>
          <Space size={4}>
            <Button type="text" size="small" icon={<SettingOutlined />} onClick={(e) => { e.stopPropagation(); onSelect(); }} />
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); onRemove(); }} />
          </Space>
        </div>
      </Card>
    </div>
  );
}
