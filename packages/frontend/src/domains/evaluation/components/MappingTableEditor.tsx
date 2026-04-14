import { Table, Button, Input, InputNumber, Space, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { ColumnDef } from '@tallia/shared';

interface MappingEntry {
  key: string;
  conditions: Record<string, unknown>;
  score: number;
}

interface Props {
  inputColumns: ColumnDef[];
  entries: MappingEntry[];
  maxScore: number;
  onSave: (entries: MappingEntry[]) => void;
  loading?: boolean;
}

export function MappingTableEditor({ inputColumns, entries: initialEntries, maxScore, onSave, loading }: Props) {
  const [entries, setEntries] = useState<MappingEntry[]>(initialEntries);

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  const handleCellChange = (index: number, field: string, value: unknown) => {
    const updated = [...entries];
    if (field === 'score') {
      updated[index] = { ...updated[index], score: value as number };
    } else {
      updated[index] = {
        ...updated[index],
        conditions: { ...updated[index].conditions, [field]: value },
      };
    }
    setEntries(updated);
  };

  const handleAddRow = () => {
    const conditions: Record<string, unknown> = {};
    inputColumns.forEach((col) => {
      conditions[col.key] = col.type === 'number' ? 0 : '';
    });
    setEntries([...entries, { key: `row-${Date.now()}`, conditions, score: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const columns = [
    ...inputColumns.map((col) => ({
      title: col.label,
      key: col.key,
      render: (_: unknown, record: MappingEntry, index: number) =>
        col.type === 'number' ? (
          <InputNumber
            size="small"
            value={record.conditions[col.key] as number}
            onChange={(v) => handleCellChange(index, col.key, v)}
          />
        ) : (
          <Input
            size="small"
            value={record.conditions[col.key] as string}
            onChange={(e) => handleCellChange(index, col.key, e.target.value)}
          />
        ),
    })),
    {
      title: `환산점수 (만점: ${maxScore})`,
      key: 'score',
      render: (_: unknown, record: MappingEntry, index: number) => (
        <InputNumber
          size="small"
          min={0}
          max={maxScore}
          value={record.score}
          onChange={(v) => handleCellChange(index, 'score', v)}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, __: MappingEntry, index: number) => (
        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveRow(index)} />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Typography.Text strong>매핑 테이블 ({entries.length}행)</Typography.Text>
        <Space>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddRow}>
            행 추가
          </Button>
          <Button type="primary" size="small" onClick={() => onSave(entries)} loading={loading}>
            저장
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={entries}
        rowKey="key"
        size="small"
        pagination={false}
        scroll={{ y: 400 }}
      />
    </div>
  );
}
