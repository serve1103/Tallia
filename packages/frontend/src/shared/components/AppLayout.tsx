import React from 'react';
import { Layout, Menu, Typography, Avatar, Result } from 'antd';
import {
  HomeOutlined,
  BankOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../domains/auth/stores/authStore';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <HomeOutlined />, label: '대시보드' },
  { key: '/trash', icon: <DeleteOutlined />, label: '휴지통' },
];

const adminItems = [
  { key: '/admin/tenants', icon: <BankOutlined />, label: '대학 관리' },
];

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <Result status="error" title="오류가 발생했습니다" subTitle="페이지를 새로고침해 주세요." />;
    }
    return this.props.children;
  }
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        width={260}
        style={{
          background: '#f8f8fa',
          borderRight: '1px solid #e4e4e7',
          padding: '24px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', marginBottom: 36 }}>
          <div
            style={{
              width: 24, height: 24, background: '#18181b', color: '#fff',
              borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
            }}
          >
            T
          </div>
          <Typography.Text strong style={{ fontSize: 18, letterSpacing: '-0.02em' }}>Tallia</Typography.Text>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{ border: 'none', background: 'transparent' }}
        />
        {user?.role === 'platform_admin' && (
          <>
            <div style={{ margin: '16px 12px', borderTop: '1px solid #e4e4e7' }} />
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={({ key }) => navigate(key)}
              items={adminItems}
              style={{ border: 'none', background: 'transparent' }}
            />
          </>
        )}
      </Sider>

      <Layout>
        <Header
          style={{
            height: 64, padding: '0 40px', background: '#fff',
            borderBottom: '1px solid #f4f4f5',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Tallia
          </Typography.Text>
          <Avatar size={32} style={{ background: '#f8f8fa', border: '1px solid #e4e4e7', color: '#09090b', fontSize: 12, fontWeight: 600 }}>
            U
          </Avatar>
        </Header>

        <Content style={{ padding: 40, overflow: 'auto', background: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
