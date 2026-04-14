import { Badge, Tooltip, Tag } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ValidationResult } from '@tallia/shared';

interface Props {
  result: ValidationResult | null;
}

export function ValidationBadge({ result }: Props) {
  if (!result) return null;

  if (result.valid) {
    return (
      <Tag icon={<CheckCircleOutlined />} color="success">
        유효
      </Tag>
    );
  }

  return (
    <Tooltip
      title={result.errors.map((e, i) => (
        <div key={i}>{e.message}</div>
      ))}
    >
      <Tag icon={<ExclamationCircleOutlined />} color="error">
        오류 {result.errors.length}건
      </Tag>
    </Tooltip>
  );
}
