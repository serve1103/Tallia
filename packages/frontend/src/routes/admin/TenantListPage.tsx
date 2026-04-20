import { Tag, Typography } from 'antd';
import { TenantList } from '../../domains/admin/components/TenantList';
import { useAuthStore } from '../../domains/auth/stores/authStore';
import { Navigate } from 'react-router-dom';

export function TenantListPage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== 'platform_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Typography.Title level={3} style={{ letterSpacing: '-0.03em', margin: 0 }}>
          대학 공간 관리
        </Typography.Title>
        <Tag color="default" style={{ fontWeight: 600, fontSize: 12 }}>
          platform_admin
        </Tag>
      </div>
      <TenantList />
    </div>
  );
}
