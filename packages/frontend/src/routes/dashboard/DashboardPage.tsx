import { Typography } from 'antd';

export function DashboardPage() {
  return (
    <div>
      <Typography.Title level={3} style={{ letterSpacing: '-0.03em', marginBottom: 8 }}>
        평가 관리
      </Typography.Title>
      <Typography.Text type="secondary">
        평가 목록 및 대시보드 — Phase 4에서 구현 예정
      </Typography.Text>
    </div>
  );
}
