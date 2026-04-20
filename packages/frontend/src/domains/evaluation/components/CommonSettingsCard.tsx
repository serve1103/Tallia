import { useState } from 'react';
import { Card, InputNumber, Select, Table, Button, Space, Typography, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DecimalConfig } from '@tallia/shared';

const { Text } = Typography;

export interface BlockOverride {
  blockType: string;
  method: DecimalConfig['method'];
  places: DecimalConfig['places'];
}

export interface CommonSettings {
  convertedMax: number;
  defaultDecimal: DecimalConfig;
  blockOverrides: BlockOverride[];
}

interface Props {
  value: CommonSettings;
  onChange: (settings: CommonSettings) => void;
  availableBlocks?: string[];
}

const METHOD_OPTIONS = [
  { label: '반올림', value: 'round' },
  { label: '버림 (절사)', value: 'floor' },
  { label: '올림', value: 'ceil' },
];

const PLACES_OPTIONS = [
  { label: '정수 (0자리)', value: 0 },
  { label: '소수점 1자리', value: 1 },
  { label: '소수점 2자리', value: 2 },
  { label: '소수점 3자리', value: 3 },
];

export const DEFAULT_COMMON_SETTINGS: CommonSettings = {
  convertedMax: 100,
  defaultDecimal: { method: 'round', places: 2 },
  blockOverrides: [],
};

export function CommonSettingsCard({ value, onChange, availableBlocks }: Props) {
  const [newBlockType, setNewBlockType] = useState<string>('');

  const multiplier = value.convertedMax > 0 ? value.convertedMax / 100 : 1;

  const handleConvertedMaxChange = (v: number | null) => {
    onChange({ ...value, convertedMax: v ?? 100 });
  };

  const handleMethodChange = (method: DecimalConfig['method']) => {
    onChange({ ...value, defaultDecimal: { ...value.defaultDecimal, method } });
  };

  const handlePlacesChange = (places: DecimalConfig['places']) => {
    onChange({ ...value, defaultDecimal: { ...value.defaultDecimal, places } });
  };

  const handleAddOverride = () => {
    if (!newBlockType.trim()) return;
    const already = value.blockOverrides.some((o) => o.blockType === newBlockType);
    if (already) return;
    onChange({
      ...value,
      blockOverrides: [
        ...value.blockOverrides,
        { blockType: newBlockType, method: 'round', places: 2 },
      ],
    });
    setNewBlockType('');
  };

  const handleOverrideMethodChange = (blockType: string, method: DecimalConfig['method']) => {
    onChange({
      ...value,
      blockOverrides: value.blockOverrides.map((o) =>
        o.blockType === blockType ? { ...o, method } : o,
      ),
    });
  };

  const handleOverridePlacesChange = (blockType: string, places: DecimalConfig['places']) => {
    onChange({
      ...value,
      blockOverrides: value.blockOverrides.map((o) =>
        o.blockType === blockType ? { ...o, places } : o,
      ),
    });
  };

  const handleRemoveOverride = (blockType: string) => {
    onChange({
      ...value,
      blockOverrides: value.blockOverrides.filter((o) => o.blockType !== blockType),
    });
  };

  const columns = [
    {
      title: '블록',
      dataIndex: 'blockType',
      key: 'blockType',
    },
    {
      title: '처리 방식',
      key: 'method',
      render: (_: unknown, record: BlockOverride) => (
        <Select
          size="small"
          style={{ width: 130 }}
          value={record.method}
          options={METHOD_OPTIONS}
          onChange={(v) => handleOverrideMethodChange(record.blockType, v)}
        />
      ),
    },
    {
      title: '자릿수',
      key: 'places',
      render: (_: unknown, record: BlockOverride) => (
        <Select
          size="small"
          style={{ width: 140 }}
          value={record.places}
          options={PLACES_OPTIONS}
          onChange={(v) => handleOverridePlacesChange(record.blockType, v)}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_: unknown, record: BlockOverride) => (
        <Popconfirm
          title="이 항목을 삭제하시겠습니까?"
          onConfirm={() => handleRemoveOverride(record.blockType)}
          okText="삭제"
          cancelText="취소"
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      style={{ marginTop: 24, border: '2px solid #18181b' }}
      styles={{ header: { fontWeight: 700 } }}
      title="공용 설정 (모든 평가 유형 공통)"
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>환산 만점 설정</div>
      <Space wrap style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>환산 만점</div>
          <InputNumber
            min={1}
            value={value.convertedMax}
            onChange={handleConvertedMaxChange}
            style={{ width: 140 }}
          />
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            원점수(100점 만점) × 배수 = 환산점수
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>자동 계산 배수</div>
          <InputNumber
            value={multiplier}
            disabled
            style={{ width: 140, background: '#f5f5f5', fontWeight: 700 }}
            formatter={(v) => `× ${v}`}
          />
        </div>
      </Space>

      <div style={{ fontWeight: 600, marginBottom: 4 }}>소수점 처리</div>
      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
        기본값: 평가 전체에 적용. 블록별로 개별 설정도 가능.
      </Text>
      <Space wrap style={{ marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>기본 처리 방식</div>
          <Select
            style={{ width: 160 }}
            value={value.defaultDecimal.method}
            options={METHOD_OPTIONS}
            onChange={handleMethodChange}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>기본 소수점 자릿수</div>
          <Select
            style={{ width: 160 }}
            value={value.defaultDecimal.places}
            options={PLACES_OPTIONS}
            onChange={handlePlacesChange}
          />
        </div>
      </Space>

      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
        블록별 개별 설정 (선택사항)
      </div>
      {value.blockOverrides.length > 0 && (
        <Table
          size="small"
          dataSource={value.blockOverrides}
          columns={columns}
          rowKey="blockType"
          pagination={false}
          style={{ marginBottom: 8 }}
        />
      )}
      <Space style={{ marginTop: 4 }}>
        {availableBlocks ? (
          <Select
            placeholder="블록 선택"
            style={{ width: 180 }}
            value={newBlockType || undefined}
            options={availableBlocks
              .filter((b) => !value.blockOverrides.some((o) => o.blockType === b))
              .map((b) => ({ label: b, value: b }))}
            onChange={(v) => setNewBlockType(v)}
            allowClear
          />
        ) : (
          <input
            placeholder="블록 이름 입력"
            value={newBlockType}
            onChange={(e) => setNewBlockType(e.target.value)}
            style={{
              width: 180,
              height: 32,
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              padding: '0 11px',
              fontSize: 14,
            }}
          />
        )}
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddOverride}
          disabled={!newBlockType.trim()}
        >
          블록별 소수점 설정 추가
        </Button>
      </Space>
    </Card>
  );
}
