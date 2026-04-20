import { Button, Space, message, Divider, theme, Switch, Typography } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BlockDefinition, EvaluationType, PipelineConfig, PipelineCondition } from '@tallia/shared';
import { usePipelineStore } from '../stores/pipelineStore';
import { useSavePipeline, useValidatePipeline } from '../hooks/usePipeline';
import { createEmptyBlock } from '../models/pipeline';
import { BlockCard } from './BlockCard';
import { BlockPalette } from './BlockPalette';
import { BlockParamEditor } from './BlockParamEditor';
import { ValidationBadge } from './ValidationBadge';
import { PreviewPanel } from './PreviewPanel';
import { ConditionalTabs } from './ConditionalTabs';

interface Props {
  evaluationId: string;
  evalType: EvaluationType;
  initialConfig: PipelineConfig | null;
  definitions: BlockDefinition[];
}

export function PipelineBuilder({ evaluationId, evalType, initialConfig, definitions }: Props) {
  const { token } = theme.useToken();
  const store = usePipelineStore();
  const saveMutation = useSavePipeline(evaluationId);
  const validateMutation = useValidatePipeline(evaluationId);
  const defMap = useMemo(() => new Map(definitions.map((d) => [d.type, d])), [definitions]);

  // A유형 조건부 모드 상태
  const isAType = evalType === 'A';
  const [conditionalMode, setConditionalMode] = useState(false);
  const [conditions, setConditions] = useState<PipelineCondition[]>([
    { committeeCount: 3, blocks: [] },
    { committeeCount: 5, blocks: [] },
  ]);
  const [activeConditionKey, setActiveConditionKey] = useState('0');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (initialConfig) {
      if ('conditions' in initialConfig) {
        // TypeAPipelineConfig: 조건부 모드로 복원
        setConditionalMode(true);
        setConditions(initialConfig.conditions);
        // 현재 탭의 blocks를 store에 로드
        const firstBlocks = initialConfig.conditions[0]?.blocks ?? [];
        store.setBlocks(firstBlocks);
      } else {
        const blocks = 'blocks' in initialConfig ? initialConfig.blocks : [];
        store.setBlocks(blocks);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConfig]);

  // 조건부 모드에서 탭 전환 시 현재 탭 blocks 저장 후 새 탭 blocks 로드
  const handleConditionTabChange = (key: string) => {
    if (conditionalMode) {
      const prevIdx = Number(activeConditionKey);
      setConditions((prev) => {
        const updated = [...prev];
        updated[prevIdx] = { ...updated[prevIdx], blocks: store.blocks };
        return updated;
      });
      const nextIdx = Number(key);
      store.setBlocks(conditions[nextIdx]?.blocks ?? []);
    }
    setActiveConditionKey(key);
  };

  const handleConditionCountChange = (index: number, count: number) => {
    setConditions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], committeeCount: count };
      return updated;
    });
  };

  const handleConditionalModeToggle = (checked: boolean) => {
    setConditionalMode(checked);
    if (checked) {
      // 현재 표준 blocks를 첫 번째 조건에 복사
      setConditions([
        { committeeCount: 3, blocks: store.blocks },
        { committeeCount: 5, blocks: [] },
      ]);
      setActiveConditionKey('0');
    } else {
      // 조건부 모드 해제 시 현재 탭 blocks를 표준으로
      const currentIdx = Number(activeConditionKey);
      store.setBlocks(conditions[currentIdx]?.blocks ?? store.blocks);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = Number(String(active.id).replace('block-', ''));
    const toIndex = Number(String(over.id).replace('block-', ''));
    store.moveBlock(fromIndex, toIndex);
  };

  const handleSave = () => {
    let config: PipelineConfig;
    if (isAType && conditionalMode) {
      // 현재 편집 중인 탭 blocks를 조건에 반영
      const currentIdx = Number(activeConditionKey);
      const updatedConditions = conditions.map((c, i) =>
        i === currentIdx ? { ...c, blocks: store.blocks } : c,
      );
      config = { conditions: updatedConditions };
    } else {
      config = { blocks: store.blocks };
    }
    saveMutation.mutate(config, {
      onSuccess: () => {
        message.success('파이프라인이 저장되었습니다');
        store.resetDirty();
      },
      onError: () => message.error('저장에 실패했습니다'),
    });
  };

  const handleValidate = () => {
    if (store.blocks.length === 0) {
      message.warning('블록을 먼저 추가해주세요');
      return;
    }
    validateMutation.mutate(store.blocks, {
      onSuccess: (result) => {
        store.setValidationResult(result);
        if (result.valid) {
          message.success('유효성 검증 통과');
        } else {
          message.error(`검증 실패: ${result.errors.length}건의 오류`);
        }
      },
      onError: () => message.error('검증 요청에 실패했습니다'),
    });
  };

  const selectedBlock = store.selectedBlockIndex != null ? store.blocks[store.selectedBlockIndex] : null;
  const selectedDef = selectedBlock ? defMap.get(selectedBlock.type) ?? null : null;

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <ValidationBadge result={store.validationResult} />
            {store.isDirty && <span style={{ color: token.colorWarning, fontSize: 12 }}>변경사항 있음</span>}
            {isAType && (
              <Space size={8}>
                <Switch
                  size="small"
                  checked={conditionalMode}
                  onChange={handleConditionalModeToggle}
                />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  조건부 모드 (위원수별)
                </Typography.Text>
              </Space>
            )}
          </Space>
          <Space>
            <Button icon={<CheckCircleOutlined />} onClick={handleValidate} loading={validateMutation.isPending}>
              검증
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saveMutation.isPending}>
              저장
            </Button>
          </Space>
        </div>

        {isAType && conditionalMode && (
          <ConditionalTabs
            conditions={conditions}
            activeKey={activeConditionKey}
            onChange={handleConditionTabChange}
            onConditionCountChange={handleConditionCountChange}
          />
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={store.blocks.map((_, i) => `block-${i}`)} strategy={verticalListSortingStrategy}>
            {store.blocks.map((block, i) => (
              <BlockCard
                key={`block-${i}`}
                block={block}
                index={i}
                definition={defMap.get(block.type)}
                isSelected={store.selectedBlockIndex === i}
                onSelect={() => store.selectBlock(i)}
                onRemove={() => store.removeBlock(i)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {store.blocks.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: token.colorTextTertiary, border: `2px dashed ${token.colorBorder}`, borderRadius: 8 }}>
            오른쪽 팔레트에서 블록을 추가하세요
          </div>
        )}

        <Divider />
        <PreviewPanel evaluationId={evaluationId} />
      </div>

      <div style={{ width: 260, flexShrink: 0 }}>
        <BlockPalette
          definitions={definitions}
          evalType={evalType}
          onAdd={(type, initialParams) => {
            const block = createEmptyBlock(type);
            if (initialParams) block.params = initialParams;
            store.addBlock(block);
          }}
        />
      </div>

      <BlockParamEditor
        block={selectedBlock}
        definition={selectedDef}
        open={store.selectedBlockIndex != null}
        onClose={() => store.selectBlock(null)}
        onSave={(params) => {
          if (store.selectedBlockIndex != null) {
            store.updateBlockParams(store.selectedBlockIndex, params);
          }
        }}
      />
    </div>
  );
}
