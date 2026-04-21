import { Tooltip } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ValidationResult } from '@tallia/shared';
import { StatusTag } from '../../../shared/components/StatusTag';

interface Props {
  result: ValidationResult | null;
}

export function ValidationBadge({ result }: Props) {
  if (!result) return null;

  if (result.valid) {
    return (
      <StatusTag variant="success" icon={<CheckCircleOutlined />}>
        유효
      </StatusTag>
    );
  }

  return (
    <Tooltip
      title={result.errors.map((e, i) => (
        <div key={i}>{e.message}</div>
      ))}
    >
      <StatusTag variant="error" icon={<ExclamationCircleOutlined />}>
        오류 {result.errors.length}건
      </StatusTag>
    </Tooltip>
  );
}
