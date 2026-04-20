import { useState } from 'react';
import { Button, Input, InputNumber, Space, Tag } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';

export interface ExamTypeEntry {
  name: string;
  questionCount: number;
}

interface Props {
  items: ExamTypeEntry[];
  onChange: (items: ExamTypeEntry[]) => void;
  defaultQuestionCount: number;
}

export function ExamTypeManager({ items, onChange, defaultQuestionCount }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQCount, setNewQCount] = useState<number>(defaultQuestionCount);

  const handleAdd = () => {
    const trimmed = newName.trim().toUpperCase();
    if (trimmed && !items.some((it) => it.name === trimmed)) {
      onChange([...items, { name: trimmed, questionCount: newQCount > 0 ? newQCount : defaultQuestionCount }]);
    }
    setNewName('');
    setNewQCount(defaultQuestionCount);
    setAdding(false);
  };

  const handleRemove = (name: string) => {
    onChange(items.filter((it) => it.name !== name));
  };

  const handleUpdateQCount = (name: string, qc: number | null) => {
    onChange(items.map((it) => (it.name === name ? { ...it, questionCount: qc ?? it.questionCount } : it)));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setNewName('');
      setNewQCount(defaultQuestionCount);
      setAdding(false);
    }
  };

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Space wrap size={8}>
        {items.map((item) => (
          <Tag
            key={item.name}
            closable
            closeIcon={<CloseOutlined />}
            onClose={() => handleRemove(item.name)}
            style={{ fontSize: 13, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>{item.name}형</span>
            <InputNumber
              size="small"
              min={1}
              value={item.questionCount}
              onChange={(v) => handleUpdateQCount(item.name, v)}
              style={{ width: 64 }}
              addonAfter="문항"
            />
          </Tag>
        ))}
        {adding ? (
          <Space size={4}>
            <Input
              autoFocus
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="유형 (예: C)"
              style={{ width: 90 }}
              maxLength={4}
            />
            <InputNumber
              size="small"
              min={1}
              value={newQCount}
              onChange={(v) => setNewQCount(v ?? defaultQuestionCount)}
              style={{ width: 80 }}
              addonAfter="문항"
            />
            <Button size="small" type="primary" onClick={handleAdd}>
              추가
            </Button>
            <Button
              size="small"
              onClick={() => {
                setNewName('');
                setNewQCount(defaultQuestionCount);
                setAdding(false);
              }}
            >
              취소
            </Button>
          </Space>
        ) : (
          <Button size="small" icon={<PlusOutlined />} onClick={() => { setNewQCount(defaultQuestionCount); setAdding(true); }}>
            유형 추가
          </Button>
        )}
      </Space>
      <span style={{ fontSize: 12, color: '#888' }}>
        유형별로 정답지와 배점을 별도 설정합니다. 문항수가 다른 경우 각 유형에 직접 입력하세요.
      </span>
    </Space>
  );
}
