import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

import { loginApi, getMeApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

export function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const { accessToken } = await loginApi(values.email, values.password);
      const user = await getMeApi();
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch {
      message.error('이메일 또는 비밀번호가 올바르지 않습니다');
    }
  };

  return (
    <>
      <Typography.Title level={5} style={{ marginBottom: 24 }}>로그인</Typography.Title>
      <Form layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item name="email" rules={[{ required: true, type: 'email', message: '이메일을 입력하세요' }]}>
          <Input prefix={<MailOutlined />} placeholder="이메일" size="large" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '비밀번호를 입력하세요' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" size="large" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            로그인
          </Button>
        </Form.Item>
      </Form>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </Typography.Text>
    </>
  );
}
