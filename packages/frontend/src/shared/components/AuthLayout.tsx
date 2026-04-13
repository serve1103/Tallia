import { Layout, Card, Typography } from 'antd';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <Layout style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <Card
        style={{
          width: 420, padding: '8px 0',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          border: '1px solid #e4e4e7',
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28, height: 28, background: '#18181b', color: '#fff',
                borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16,
              }}
            >
              T
            </div>
            <Typography.Title level={4} style={{ margin: 0, letterSpacing: '-0.02em' }}>Tallia</Typography.Title>
          </div>
        </div>
        <Outlet />
      </Card>
    </Layout>
  );
}
