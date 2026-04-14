import { Typography } from 'antd';
import { TenantList } from '../../domains/admin/components/TenantList';

export function TenantListPage() {
  return (
    <div>
      <Typography.Title level={3} style={{ letterSpacing: '-0.03em', marginBottom: 24 }}>
        대학 관리
      </Typography.Title>
      <TenantList />
    </div>
  );
}
