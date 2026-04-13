import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

import { signupApi } from '../api/auth';

export function SignupForm() {
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string; name: string; inviteCode?: string }) => {
    try {
      await signupApi(values.email, values.password, values.name, values.inviteCode);
      message.success('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');
    } catch {
      message.error('회원가입에 실패했습니다');
    }
  };

  return (
    <>
      <Typography.Title level={5} style={{ marginBottom: 24 }}>회원가입</Typography.Title>
      <Form layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item name="email" rules={[{ required: true, type: 'email', message: '이메일을 입력하세요' }]}>
          <Input prefix={<MailOutlined />} placeholder="이메일" size="large" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, min: 8, message: '비밀번호 8자 이상' }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="비밀번호" size="large" />
        </Form.Item>
        <Form.Item name="name" rules={[{ required: true, message: '이름을 입력하세요' }]}>
          <Input prefix={<UserOutlined />} placeholder="이름" size="large" />
        </Form.Item>
        <Form.Item name="inviteCode">
          <Input prefix={<KeyOutlined />} placeholder="초대 코드 (선택)" size="large" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            회원가입
          </Button>
        </Form.Item>
      </Form>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </Typography.Text>
    </>
  );
}
