import { Button, Space, message, Divider, theme } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useEffect, useMemo } from 'react';
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
import type { BlockDefinition, EvaluationType, PipelineConfig } from '@tallia/shared';
import { usePipelineStore } from '../stores/pipelineStore';
import { useSavePipeline, useValidatePipeline } from '../hooks/usePipeline';
import { createEmptyBlock } from '../models/pipeline';
import { BlockCard } from './BlockCard';
import { BlockPalette } from './BlockPalette';
import { BlockParamEditor } from './BlockParamEditor';
import { ValidationBadge } from './ValidationBadge';
import { PreviewPanel } from './PreviewPanel';

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (initialConfig) {
      const blocks = 'blocks' in initialConfig ? initialConfig.blocks : [];
      store.setBlocks(blocks);
    }
  }, [initialConfig]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = Number(String(active.id).replace('block-', ''));
    const toIndex = Number(String(over.id).replace('block-', ''));
    store.moveBlock(fromIndex, toIndex);
  };

  const handleSave = () => {
    const config: PipelineConfig = { blocks: store.blocks };
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
