import { Descriptions, Table, Button, Spin, Typography, Space, Tag, message, Popconfirm } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@tallia/shared';
import { useTenant, useTenantUsers, useRemoveTenantUser } from '../hooks/useTenants';
import { formatDate, formatDateTime } from '../../../shared/lib/format';

interface TenantDetailProps {
  tenantId: string;
}

export function TenantDetail({ tenantId }: TenantDetailProps) {
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useTenant(tenantId);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data: usersData, isLoading: usersLoading } = useTenantUsers(tenantId, page, pageSize);
  const removeMutation = useRemoveTenantUser();

  const handleRemoveUser = (userId: string) => {
    removeMutation.mutate(
      { tenantId, userId },
      {
        onSuccess: () => message.success('사용자가 제거되었습니다'),
        onError: () => message.error('제거에 실패했습니다'),
      },
    );
  };

  if (isLoading) return <Spin />;
  if (!tenant) return <Typography.Text>테넌트를 찾을 수 없습니다</Typography.Text>;

  const userColumns = [
    { title: '이름', dataIndex: 'name', key: 'name' },
    { title: '이메일', dataIndex: 'email', key: 'email' },
    {
      title: '역할',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'platform_admin' ? 'default' : 'blue'}>{role}</Tag>
      ),
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: formatDateTime,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Popconfirm title="이 사용자를 제거하시겠습니까?" onConfirm={() => handleRemoveUser(record.id)}>
          <Button type="text" danger size="small">
            제거
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/admin/tenants')}>
          목록으로
        </Button>
      </Space>

      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        {tenant.name}
      </Typography.Title>

      <Descriptions bordered column={2} size="small" style={{ marginBottom: 32 }}>
        <Descriptions.Item label="허용 도메인">
          {tenant.allowedDomains.map((d) => (
            <Tag key={d}>{d}</Tag>
          ))}
        </Descriptions.Item>
        <Descriptions.Item label="초대 코드">{tenant.inviteCode}</Descriptions.Item>
        <Descriptions.Item label="데이터 보관">{tenant.dataRetentionYears}년</Descriptions.Item>
        <Descriptions.Item label="생성일">{formatDate(tenant.createdAt)}</Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        사용자 목록
      </Typography.Title>
      <Table
        columns={userColumns}
        dataSource={usersData?.data}
        rowKey="id"
        loading={usersLoading}
        size="small"
        pagination={{
          current: page,
          pageSize,
          total: usersData?.meta?.total,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
