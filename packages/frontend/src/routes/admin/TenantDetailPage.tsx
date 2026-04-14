import { useParams } from 'react-router-dom';
import { Typography } from 'antd';
import { TenantDetail } from '../../domains/admin/components/TenantDetail';

export function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();

  if (!tenantId) {
    return <Typography.Text>잘못된 접근입니다</Typography.Text>;
  }

  return <TenantDetail tenantId={tenantId} />;
}
