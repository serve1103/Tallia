import {
  Descriptions,
  Table,
  Button,
  Spin,
  Typography,
  Space,
  Tag,
  message,
  Popconfirm,
  Form,
  Input,
  InputNumber,
  Card,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@tallia/shared';
import { useTenant, useTenantUsers, useRemoveTenantUser, useUpdateTenant, useDeleteTenant } from '../hooks/useTenants';
import { formatDate, formatDateTime } from '../../../shared/lib/format';

interface TenantDetailProps {
  tenantId: string;
}

interface EditTenantForm {
  name: string;
  allowedDomains: string;
  inviteCode: string;
  dataRetentionYears: number;
}

export function TenantDetail({ tenantId }: TenantDetailProps) {
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useTenant(tenantId);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data: usersData, isLoading: usersLoading } = useTenantUsers(tenantId, page, pageSize);
  const removeMutation = useRemoveTenantUser();
  const updateMutation = useUpdateTenant();
  const deleteMutation = useDeleteTenant();

  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm<EditTenantForm>();

  const handleRemoveUser = (userId: string) => {
    removeMutation.mutate(
      { tenantId, userId },
      {
        onSuccess: () => message.success('사용자가 제거되었습니다'),
        onError: () => message.error('제거에 실패했습니다'),
      },
    );
  };

  const handleStartEdit = () => {
    if (!tenant) return;
    form.setFieldsValue({
      name: tenant.name,
      allowedDomains: tenant.allowedDomains.join(', '),
      inviteCode: tenant.inviteCode,
      dataRetentionYears: tenant.dataRetentionYears,
    });
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    form.resetFields();
  };

  const handleSave = (values: EditTenantForm) => {
    const allowedDomains = values.allowedDomains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    updateMutation.mutate(
      {
        tenantId,
        name: values.name,
        allowedDomains,
        inviteCode: values.inviteCode,
        dataRetentionYears: values.dataRetentionYears,
      },
      {
        onSuccess: () => {
          message.success('수정되었습니다');
          setEditing(false);
          form.resetFields();
        },
        onError: () => message.error('수정에 실패했습니다'),
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(tenantId, {
      onSuccess: () => {
        message.success('삭제되었습니다');
        navigate('/admin/tenants');
      },
      onError: () => message.error('삭제에 실패했습니다'),
    });
  };

  if (isLoading) return <Spin />;
  if (!tenant) return <Typography.Text>테넌트를 찾을 수 없습니다</Typography.Text>;

  const userColumns = [
    { title: '이메일', dataIndex: 'email', key: 'email' },
    { title: '이름', dataIndex: 'name', key: 'name' },
    {
      title: '역할',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color="default">{role}</Tag>
      ),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: formatDateTime,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Popconfirm
          title="이 사용자를 제거하시겠습니까?"
          onConfirm={() => handleRemoveUser(record.id)}
          okText="제거"
          cancelText="취소"
        >
          <Button type="text" danger size="small" loading={removeMutation.isPending}>
            제거
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/admin/tenants')}>
            목록으로
          </Button>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {tenant.name}
          </Typography.Title>
        </Space>
        <Popconfirm
          title="대학 공간을 삭제하시겠습니까?"
          description="삭제된 데이터는 복구할 수 없습니다."
          onConfirm={handleDelete}
          okText="삭제"
          cancelText="취소"
          okButtonProps={{ danger: true }}
        >
          <Button danger loading={deleteMutation.isPending}>
            테넌트 삭제
          </Button>
        </Popconfirm>
      </div>

      <Card
        title="상세 정보"
        extra={
          !editing && (
            <Button icon={<EditOutlined />} onClick={handleStartEdit}>
              수정
            </Button>
          )
        }
        style={{ marginBottom: 32 }}
      >
        {editing ? (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              label="대학명"
              name="name"
              rules={[{ required: true, message: '대학명을 입력하세요' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="허용 도메인"
              name="allowedDomains"
              rules={[{ required: true, message: '허용 도메인을 입력하세요' }]}
              extra="쉼표로 구분하여 여러 도메인 입력 가능"
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="초대 코드"
              name="inviteCode"
              rules={[{ required: true, message: '초대 코드를 입력하세요' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="데이터 보관 연수"
              name="dataRetentionYears"
              rules={[{ required: true, message: '데이터 보관 연수를 입력하세요' }]}
            >
              <InputNumber min={1} max={99} addonAfter="년" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={handleCancelEdit}>취소</Button>
                <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                  저장
                </Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="대학명">{tenant.name}</Descriptions.Item>
            <Descriptions.Item label="초대 코드">{tenant.inviteCode}</Descriptions.Item>
            <Descriptions.Item label="허용 도메인">
              {tenant.allowedDomains.map((d) => (
                <Tag key={d}>{d}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="데이터 보관">{tenant.dataRetentionYears}년</Descriptions.Item>
            <Descriptions.Item label="생성일">{formatDate(tenant.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="수정일">{formatDate(tenant.updatedAt)}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

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
