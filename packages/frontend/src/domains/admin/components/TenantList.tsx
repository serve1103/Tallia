import { Table, Button, Tag, Space, message, Popconfirm, Modal, Form, Input, InputNumber } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Tenant } from '@tallia/shared';
import { useTenants, useCreateTenant, useDeleteTenant } from '../hooks/useTenants';
import { formatDate } from '../../../shared/lib/format';

interface CreateTenantForm {
  name: string;
  allowedDomains: string;
  inviteCode: string;
  dataRetentionYears: number;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function TenantList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isLoading } = useTenants(page, pageSize);
  const deleteMutation = useDeleteTenant();
  const createMutation = useCreateTenant();

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<CreateTenantForm>();

  const handleDelete = (tenantId: string) => {
    deleteMutation.mutate(tenantId, {
      onSuccess: () => message.success('삭제되었습니다'),
      onError: () => message.error('삭제에 실패했습니다'),
    });
  };

  const handleCreate = (values: CreateTenantForm) => {
    const allowedDomains = values.allowedDomains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    createMutation.mutate(
      {
        name: values.name,
        allowedDomains,
        inviteCode: values.inviteCode,
        dataRetentionYears: values.dataRetentionYears,
      },
      {
        onSuccess: () => {
          message.success('대학 공간이 생성되었습니다');
          setModalOpen(false);
          form.resetFields();
        },
        onError: () => message.error('생성에 실패했습니다'),
      },
    );
  };

  const handleOpenModal = () => {
    form.setFieldValue('inviteCode', generateInviteCode());
    form.setFieldValue('dataRetentionYears', 3);
    setModalOpen(true);
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
      render: (domains: string[]) =>
        domains.map((d) => (
          <Tag key={d} style={{ marginBottom: 2 }}>
            {d}
          </Tag>
        )),
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
      title: '관리',
      key: 'actions',
      render: (_: unknown, record: Tenant) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/admin/tenants/${record.id}`)}>
            상세
          </Button>
          <Popconfirm
            title="정말 삭제하시겠습니까?"
            description="삭제된 데이터는 복구할 수 없습니다."
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="text" danger size="small" loading={deleteMutation.isPending}>
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          대학 공간 생성
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
          total: data?.meta?.total,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />

      <Modal
        title="대학 공간 생성"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="대학명"
            name="name"
            rules={[{ required: true, message: '대학명을 입력하세요' }]}
          >
            <Input placeholder="예: 서울대학교" />
          </Form.Item>

          <Form.Item
            label="허용 이메일 도메인"
            name="allowedDomains"
            rules={[{ required: true, message: '허용 도메인을 입력하세요' }]}
            extra="쉼표로 구분하여 여러 도메인 입력 가능 (예: @snu.ac.kr)"
          >
            <Input placeholder="@snu.ac.kr" />
          </Form.Item>

          <Form.Item
            label="초대 코드"
            name="inviteCode"
            rules={[{ required: true, message: '초대 코드를 입력하세요' }]}
          >
            <Input
              placeholder="초대 코드"
              suffix={
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => form.setFieldValue('inviteCode', generateInviteCode())}
                  style={{ padding: '0 4px' }}
                >
                  자동 생성
                </Button>
              }
            />
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
              <Button
                onClick={() => {
                  setModalOpen(false);
                  form.resetFields();
                }}
              >
                취소
              </Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                생성
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
