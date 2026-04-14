import { Layout, Menu, Typography, Avatar } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  UploadOutlined,
  BarChartOutlined,
  BankOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <HomeOutlined />, label: '대시보드' },
  { key: '/evaluations', icon: <FileTextOutlined />, label: '평가 관리' },
  { key: '/upload', icon: <UploadOutlined />, label: '엑셀 업로드' },
  { key: '/results', icon: <BarChartOutlined />, label: '결과 조회' },
];

const adminItems = [
  { key: '/admin/tenants', icon: <BankOutlined />, label: '대학 관리' },
  { key: '/admin/settings', icon: <SettingOutlined />, label: '설정' },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

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
        <div style={{ margin: '16px 12px', borderTop: '1px solid #e4e4e7' }} />
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={adminItems}
          style={{ border: 'none', background: 'transparent' }}
        />
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
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
