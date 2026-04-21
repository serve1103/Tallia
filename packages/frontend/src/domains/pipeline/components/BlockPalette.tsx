import { useState } from 'react';
import { Card, Typography, Space, Tooltip } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import type { BlockDefinition, EvaluationType } from '@tallia/shared';
import {
  getCategoryGroup,
  getGroupLabel,
  getGroupVariant,
  CATEGORY_DISPLAY_ORDER,
  type CategoryGroup,
} from '../models/pipeline';
import { StatusTag } from '../../../shared/components/StatusTag';
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
  /** 이미 파이프라인에 추가된 블록 type 목록. 중복 방지를 위해 비활성 처리. */
  existingTypes?: string[];
  onAdd: (type: string, initialParams?: Record<string, unknown>) => void;
}

export function BlockPalette({ definitions, evalType, existingTypes, onAdd }: Props) {
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const existingSet = new Set(existingTypes ?? []);

  const available = definitions.filter(
    (d) => d.applicableTypes.includes(evalType) && !CUSTOM_BLOCK_TYPES.has(d.type),
  );

  const grouped = available.reduce(
    (acc, def) => {
      const group = getCategoryGroup(def.category, def.type);
      if (!acc[group]) acc[group] = [];
      acc[group]!.push(def);
      return acc;
    },
    {} as Partial<Record<CategoryGroup, BlockDefinition[]>>,
  );

  const orderedGroups = CATEGORY_DISPLAY_ORDER.filter((g) => grouped[g] && grouped[g]!.length > 0);

  return (
    <div>
      <Typography.Text strong style={{ display: 'block', fontSize: 14 }}>
        단계 추가
      </Typography.Text>
      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>
        클릭하여 왼쪽 계산 순서에 단계를 추가합니다
      </Typography.Text>
      {orderedGroups.map((group) => (
        <div key={group} style={{ marginBottom: 16 }}>
          <StatusTag variant={getGroupVariant(group)} style={{ marginBottom: 8 }}>
            {getGroupLabel(group)}
          </StatusTag>
          {grouped[group]!.map((def) => {
            const already = existingSet.has(def.type);
            const card = (
              <Card
                key={def.type}
                size="small"
                hoverable={!already}
                style={{
                  marginBottom: 4,
                  cursor: already ? 'not-allowed' : 'pointer',
                  opacity: already ? 0.5 : 1,
                  background: already ? '#fafafa' : undefined,
                }}
                onClick={() => {
                  if (already) return;
                  onAdd(def.type);
                }}
              >
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Space size={6}>
                    {already
                      ? <CheckOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
                      : <PlusOutlined style={{ color: '#a1a1aa', fontSize: 12 }} />}
                    <Typography.Text style={{ fontSize: 13, color: already ? '#9ca3af' : undefined }}>
                      {def.name}
                    </Typography.Text>
                  </Space>
                  {already && (
                    <Typography.Text style={{ fontSize: 11, color: '#9ca3af' }}>추가됨</Typography.Text>
                  )}
                </Space>
              </Card>
            );
            return already ? (
              <Tooltip key={def.type} title="이 단계는 이미 추가되어 있습니다" placement="left">
                {card}
              </Tooltip>
            ) : (
              card
            );
          })}
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
              사용자 정의 단계 (가산점·비율·구간·수식)
            </Typography.Text>
          </Space>
        </Card>
        <Typography.Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
          사용자 정의 단계는 여러 번 추가 가능
        </Typography.Text>
      </div>

      <CustomStepTemplateModal
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        onSelect={(blockType, initialParams) => onAdd(blockType, initialParams)}
      />
    </div>
  );
}
