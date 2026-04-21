import { Modal, Card, Typography, Space, Tag } from 'antd';
import { CUSTOM_STEP_TEMPLATES } from '../models/pipeline';

interface Props {
  open: boolean;
  onCancel: () => void;
  onSelect: (blockType: string, initialParams: Record<string, unknown>) => void;
}

export function CustomStepTemplateModal({ open, onCancel, onSelect }: Props) {
  const handleSelect = (blockType: string, defaultParams: Record<string, unknown>) => {
    onSelect(blockType, defaultParams);
    onCancel();
  };

  return (
    <Modal
      title="사용자 정의 단계 템플릿 선택"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={560}
    >
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
        템플릿을 선택하면 기본 파라미터로 단계가 추가됩니다. 이후 단계를 클릭해 파라미터를 수정할 수 있습니다.
      </Typography.Text>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {CUSTOM_STEP_TEMPLATES.map((tpl) => (
          <Card
            key={tpl.blockType}
            size="small"
            hoverable
            style={{ cursor: 'pointer', border: '1px solid #e4e4e7' }}
            onClick={() => handleSelect(tpl.blockType, tpl.defaultParams)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Typography.Text strong style={{ fontSize: 14 }}>
                  {tpl.label}
                </Typography.Text>
                <Typography.Paragraph
                  type="secondary"
                  style={{ margin: '4px 0 0', fontSize: 12 }}
                >
                  {tpl.description}
                </Typography.Paragraph>
              </div>
              <Tag style={{ marginLeft: 12, flexShrink: 0, color: '#52525b', borderColor: '#d4d4d8', background: '#fafafa' }}>
                {tpl.example}
              </Tag>
            </div>
          </Card>
        ))}
      </Space>
    </Modal>
  );
}
