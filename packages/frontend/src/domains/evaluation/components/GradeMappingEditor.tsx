import { Button, Input, InputNumber, Space, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  value?: Record<string, number>;
  onChange?: (next: Record<string, number>) => void;
}

export function GradeMappingEditor({ value = {}, onChange }: Props) {
  const entries = Object.entries(value);

  const handleGradeChange = (oldGrade: string, newGrade: string) => {
    const next: Record<string, number> = {};
    for (const [k, v] of Object.entries(value)) {
      next[k === oldGrade ? newGrade : k] = v;
    }
    onChange?.(next);
  };

  const handleScoreChange = (grade: string, score: number | null) => {
    const next = { ...value, [grade]: score ?? 0 };
    onChange?.(next);
  };

  const handleRemove = (grade: string) => {
    const next = { ...value };
    delete next[grade];
    onChange?.(next);
  };

  const handleAdd = () => {
    const newGrade = `등급${entries.length + 1}`;
    const key = Object.keys(value).includes(newGrade)
      ? `등급${Date.now()}`
      : newGrade;
    onChange?.({ ...value, [key]: 0 });
  };

  return (
    <div style={{ marginTop: 8 }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        등급별 점수 매핑
      </Text>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {entries.map(([grade, score]) => (
          <Space key={grade} size={8} align="center">
            <Input
              value={grade}
              onChange={(e) => handleGradeChange(grade, e.target.value)}
              placeholder="등급명"
              style={{ width: 80 }}
            />
            <ArrowRightOutlined style={{ color: '#8c8c8c' }} />
            <InputNumber
              value={score}
              onChange={(v) => handleScoreChange(grade, v)}
              min={0}
              placeholder="점수"
              style={{ width: 80 }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleRemove(grade)}
            />
          </Space>
        ))}
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ marginTop: 4 }}
        >
          등급 추가
        </Button>
      </Space>
    </div>
  );
}
