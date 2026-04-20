import { Alert, Button } from 'antd';

interface Props {
  needsRecalculation: boolean;
  onRecalculate: () => void;
  loading: boolean;
}

export function RecalculationBanner({ needsRecalculation, onRecalculate, loading }: Props) {
  if (!needsRecalculation) return null;

  return (
    <Alert
      type="warning"
      showIcon
      message="설정이 변경되었습니다. 파이프라인 설정이 마지막 계산 이후 수정되었습니다."
      style={{ marginBottom: 16 }}
      action={
        <Button size="small" onClick={onRecalculate} loading={loading}>
          재계산
        </Button>
      }
    />
  );
}
