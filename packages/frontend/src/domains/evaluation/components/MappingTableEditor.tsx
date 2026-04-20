import { Table, Button, Input, InputNumber, Space, Typography, Tabs, Upload, message } from 'antd';
import { PlusOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { ColumnDef } from '@tallia/shared';
import { apiClient } from '../../../shared/lib/api-client';

interface MappingEntry {
  key: string;
  conditions: Record<string, unknown>;
  score: number;
}

interface Props {
  evaluationId?: string;
  inputColumns: ColumnDef[];
  entries: MappingEntry[];
  maxScore: number;
  onSave: (entries: MappingEntry[]) => void;
  loading?: boolean;
  groups?: string[];
  entriesByGroup?: Record<string, MappingEntry[]>;
  onSaveGroup?: (group: string, entries: MappingEntry[]) => void;
  showExcelButtons?: boolean;
}

function SingleTable({
  inputColumns,
  entries: initialEntries,
  maxScore,
  onSave,
  loading,
}: {
  inputColumns: ColumnDef[];
  entries: MappingEntry[];
  maxScore: number;
  onSave: (entries: MappingEntry[]) => void;
  loading?: boolean;
}) {
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

export function MappingTableEditor({
  evaluationId,
  inputColumns,
  entries,
  maxScore,
  onSave,
  loading,
  groups,
  entriesByGroup,
  onSaveGroup,
  showExcelButtons,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | undefined>(groups?.[0]);

  const handleDownload = async () => {
    if (!evaluationId) return;
    try {
      const response = await apiClient.get(`/evaluations/${evaluationId}/mapping-table/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mapping_template_${evaluationId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('다운로드에 실패했습니다');
    }
  };

  const handleUpload = async (file: File) => {
    if (!evaluationId) return false;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post(`/evaluations/${evaluationId}/mapping-table/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('업로드가 완료되었습니다');
    } catch {
      message.error('업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const excelBar = showExcelButtons && evaluationId ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        엑셀 양식 다운로드 후 작성하여 업로드하세요
      </Typography.Text>
      <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload}>
        양식 다운로드
      </Button>
      <Upload
        accept=".xlsx,.xls"
        showUploadList={false}
        beforeUpload={handleUpload}
      >
        <Button size="small" icon={<UploadOutlined />} loading={uploading}>
          엑셀 업로드
        </Button>
      </Upload>
    </div>
  ) : null;

  if (groups && groups.length > 0 && entriesByGroup && onSaveGroup) {
    const tabItems = groups.map((group) => ({
      key: group,
      label: group,
      children: (
        <SingleTable
          inputColumns={inputColumns}
          entries={entriesByGroup[group] ?? []}
          maxScore={maxScore}
          onSave={(updated) => onSaveGroup(group, updated)}
          loading={loading}
        />
      ),
    }));

    return (
      <div>
        {excelBar}
        <Tabs
          activeKey={activeGroup ?? groups[0]}
          onChange={setActiveGroup}
          items={tabItems}
          tabBarExtraContent={
            <Button size="small" icon={<PlusOutlined />} onClick={() => {
              const name = `그룹${groups.length + 1}`;
              onSaveGroup(name, []);
            }}>
              그룹 추가
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {excelBar}
      <SingleTable
        inputColumns={inputColumns}
        entries={entries}
        maxScore={maxScore}
        onSave={onSave}
        loading={loading}
      />
    </div>
  );
}
