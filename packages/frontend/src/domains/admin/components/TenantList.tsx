import { Table, Button, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Tenant } from '@tallia/shared';
import { useTenants, useDeleteTenant } from '../hooks/useTenants';
import { formatDate } from '../../../shared/lib/format';

export function TenantList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isLoading } = useTenants(page, pageSize);
  const deleteMutation = useDeleteTenant();

  const handleDelete = (tenantId: string) => {
    deleteMutation.mutate(tenantId, {
      onSuccess: () => message.success('삭제되었습니다'),
      onError: () => message.error('삭제에 실패했습니다'),
    });
  };

  const columns = [
    {
      title: '대학명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Tenant) => (
        <Link to={`/admin/tenants/${record.id}`}>{name}</Link>
      ),
    },
    {
      title: '허용 도메인',
      dataIndex: 'allowedDomains',
      key: 'allowedDomains',
      render: (domains: string[]) => domains.map((d) => <Tag key={d}>{d}</Tag>),
    },
    {
      title: '초대 코드',
      dataIndex: 'inviteCode',
      key: 'inviteCode',
    },
    {
      title: '데이터 보관',
      dataIndex: 'dataRetentionYears',
      key: 'dataRetentionYears',
      render: (years: number) => `${years}년`,
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: formatDate,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: Tenant) => (
        <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)}>
          <Button type="text" danger size="small">
            삭제
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/tenants/create')}>
          대학 추가
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta.total,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
