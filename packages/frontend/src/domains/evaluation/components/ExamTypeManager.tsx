import { useState } from 'react';
import { Button, Input, InputNumber, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

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
  const [newName, setNewName] = useState('');
  const [newQCount, setNewQCount] = useState<number>(defaultQuestionCount);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (items.some((it) => it.name === trimmed)) return;
    onChange([
      ...items,
      { name: trimmed, questionCount: newQCount > 0 ? newQCount : defaultQuestionCount },
    ]);
    setNewName('');
    setNewQCount(defaultQuestionCount);
  };

  const handleRemove = (name: string) => {
    onChange(items.filter((it) => it.name !== name));
  };

  const handleUpdateName = (prevName: string, nextName: string) => {
    const trimmed = nextName.trim();
    if (!trimmed) return;
    // 중복 방지
    if (items.some((it) => it.name === trimmed && it.name !== prevName)) return;
    onChange(items.map((it) => (it.name === prevName ? { ...it, name: trimmed } : it)));
  };

  const handleUpdateQCount = (name: string, qc: number | null) => {
    onChange(items.map((it) => (it.name === name ? { ...it, questionCount: qc ?? it.questionCount } : it)));
  };

  const handleNewKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <Space direction="vertical" size={6} style={{ width: '100%' }}>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item) => (
            <Space key={item.name} size={8} align="center">
              <Input
                size="small"
                value={item.name}
                onChange={(e) => handleUpdateName(item.name, e.target.value)}
                placeholder="유형명"
                style={{ width: 140 }}
                maxLength={10}
              />
              <InputNumber
                size="small"
                min={1}
                value={item.questionCount}
                onChange={(v) => handleUpdateQCount(item.name, v)}
                style={{ width: 110 }}
                addonAfter="문항"
              />
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(item.name)}
              />
            </Space>
          ))}
        </div>
      )}

      <Space size={8} align="center">
        <Input
          size="small"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleNewKeyDown}
          placeholder="유형명 (예: 기본, A, B)"
          style={{ width: 140 }}
          maxLength={10}
        />
        <InputNumber
          size="small"
          min={1}
          value={newQCount}
          onChange={(v) => setNewQCount(v ?? defaultQuestionCount)}
          style={{ width: 110 }}
          addonAfter="문항"
        />
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          유형 추가
        </Button>
      </Space>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        유형별로 정답지와 배점을 별도 설정합니다. 문항수가 다르면 각 유형에 직접 입력하세요.
      </Typography.Text>
    </Space>
  );
}
