import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Text className="mono" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>XATO 404</Text>
      <Title level={3} style={{ margin: 0 }}>Sahifa topilmadi</Title>
      <Text type="secondary" style={{ marginBottom: 16 }}>
        Siz izlagan sahifa mavjud emas yoki ko'chirilgan.
      </Text>
      <Button type="primary" onClick={() => navigate('/')}>Dashboardga qaytish</Button>
    </div>
  );
}
