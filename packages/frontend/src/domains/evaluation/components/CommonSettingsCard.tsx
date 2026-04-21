import { Card, InputNumber, Select, Space, Typography } from 'antd';
import type { DecimalConfig } from '@tallia/shared';

const { Text } = Typography;

export interface CommonSettings {
  convertedMax: number;
  defaultDecimal: DecimalConfig;
}

interface Props {
  value: CommonSettings;
  onChange: (settings: CommonSettings) => void;
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
};

export function CommonSettingsCard({ value, onChange }: Props) {
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

      <div style={{ fontWeight: 600, marginBottom: 4 }}>기본 소수점 처리</div>
      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
        모든 계산 단계에 공통 적용. 특정 단계만 다른 규칙을 쓰고 싶다면 계산 과정 페이지에서 해당 단계의 "소수점 처리" 항목을 조정하세요.
      </Text>
      <Space wrap style={{ marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>처리 방식</div>
          <Select
            style={{ width: 160 }}
            value={value.defaultDecimal.method}
            options={METHOD_OPTIONS}
            onChange={handleMethodChange}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>자릿수</div>
          <Select
            style={{ width: 160 }}
            value={value.defaultDecimal.places}
            options={PLACES_OPTIONS}
            onChange={handlePlacesChange}
          />
        </div>
      </Space>
    </Card>
  );
}
