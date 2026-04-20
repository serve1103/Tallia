import { useState } from 'react';
import { Tag, Button, Input, Space } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';

interface Props {
  examTypes: string[];
  onChange: (types: string[]) => void;
}

export function ExamTypeManager({ examTypes, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed && !examTypes.includes(trimmed)) {
      onChange([...examTypes, trimmed]);
    }
    setInputValue('');
    setAdding(false);
  };

  const handleRemove = (type: string) => {
    onChange(examTypes.filter((t) => t !== type));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setAdding(false);
    }
  };

  return (
    <Space wrap size={8}>
      {examTypes.map((type) => (
        <Tag
          key={type}
          closable
          closeIcon={<CloseOutlined />}
          onClose={() => handleRemove(type)}
          style={{ fontSize: 13, padding: '2px 8px' }}
        >
          {type}형
        </Tag>
      ))}
      {adding ? (
        <Input
          autoFocus
          size="small"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAdd}
          placeholder="유형 (예: C)"
          style={{ width: 100 }}
          maxLength={4}
        />
      ) : (
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setAdding(true)}
        >
          유형 추가
        </Button>
      )}
      <span style={{ fontSize: 12, color: '#888' }}>
        유형별로 정답지와 배점을 별도 설정합니다
      </span>
    </Space>
  );
}
