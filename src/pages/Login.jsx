import { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../features/auth/authSlice';

const { Title, Text } = Typography;

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || '/';

  const onFinish = async (values) => {
    setSubmitting(true);
    setError(null);
    const result = await dispatch(loginUser(values));
    setSubmitting(false);
    if (loginUser.fulfilled.match(result)) {
      navigate(from, { replace: true });
    } else {
      setError(result.payload || "Kirishda xatolik yuz berdi");
    }
  };

  return (
    <div className="auth-backdrop">
      <div
        style={{
          width: 380,
          background: 'var(--panel)',
          borderRadius: 14,
          padding: '36px 36px 28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--lab-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
            }}
          >
            C
          </div>
          <div>
            <Title level={4} style={{ margin: 0, lineHeight: 1.1 }}>ChemLab UZ</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>Laboratoriya boshqaruv tizimi</Text>
          </div>
        </div>

        <div className="hairline-divider" style={{ margin: '20px 0' }} />

        <Text style={{ display: 'block', marginBottom: 18, color: 'var(--ink-soft)', fontSize: 13 }}>
          Davom etish uchun ish hisobingizga kiring.
        </Text>

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email kiritilishi shart' },
              { type: 'email', message: "To'g'ri email kiriting" },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: 'var(--ink-soft)' }} />} placeholder="ism@lab.uz" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Parol"
            rules={[{ required: true, message: 'Parol kiritilishi shart' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--ink-soft)' }} />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ marginTop: 4 }}>
            Kirish
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hisobingiz yo'qmi? Administratoringizga murojaat qiling.
          </Text>
        </div>
      </div>
    </div>
  );
}
