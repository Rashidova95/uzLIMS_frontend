import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Spin, Alert, List, Progress } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import dashboardService from '../features/dashboard/dashboardService';
import chemicalService from '../features/chemicals/chemicalService';
import EmptyState from '../components/common/EmptyState';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  received: '#2B6693',
  in_progress: '#B9791F',
  completed: '#0F6E56',
  archived: '#6B6A5F',
};

const STATUS_LABELS = {
  received: 'Qabul qilindi',
  in_progress: 'Jarayonda',
  completed: 'Tugallandi',
  archived: 'Arxivlandi',
};

function StatCard({ label, value, hint, accent }) {
  return (
    <Card bordered styles={{ body: { padding: '16px 18px' } }}>
      <Text style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{label}</Text>
      <div style={{ fontSize: 26, fontWeight: 600, marginTop: 6, fontFamily: "'IBM Plex Mono', monospace" }}>
        {value}
      </div>
      {hint && (
        <div style={{ marginTop: 6 }}>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              background: accent?.bg || 'var(--lab-teal-soft)',
              color: accent?.color || 'var(--lab-teal-deep)',
            }}
          >
            {hint}
          </span>
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([dashboardService.stats(), chemicalService.alerts()])
      .then(([statsData, alertsData]) => {
        if (!mounted) return;
        setStats(statsData);

        // Backend /chemicals/alerts/ uchta alohida ro'yxat qaytaradi:
        // { low_stock: [...], expiring_soon: [...], expired: [...] }
        // Buni bitta ro'yxatga birlashtiramiz, sabab yorlig'i bilan, id bo'yicha dublikatlarsiz.
        const merged = new Map();
        (alertsData?.expired || []).forEach((c) =>
          merged.set(c.id, { ...c, reason: 'Muddati tugagan', tone: 'red' })
        );
        (alertsData?.expiring_soon || []).forEach((c) => {
          if (!merged.has(c.id)) merged.set(c.id, { ...c, reason: 'Muddati tugayapti', tone: 'amber' });
        });
        (alertsData?.low_stock || []).forEach((c) => {
          if (!merged.has(c.id)) merged.set(c.id, { ...c, reason: 'Kam qoldi', tone: 'amber' });
        });
        setAlerts(Array.from(merged.values()));
      })
      .catch((err) => {
        if (mounted) setError(err.response?.data?.detail || "Statistikani yuklab bo'lmadi");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" showIcon message={error} />;
  }

  // Backend haqiqiy javobi: { samples: {...}, experiments: {...}, laborant_rating: [...], inventory: {...} }
  const totalSamples = stats?.samples?.total ?? 0;
  const newThisWeek = stats?.samples?.week ?? 0;
  const byStatus = stats?.samples?.by_status ?? {};
  const inProgress = byStatus.in_progress ?? 0;
  const completed = byStatus.completed ?? 0;
  const experimentsPending = stats?.experiments?.pending ?? 0;
  const laborantActivity = stats?.laborant_rating ?? [];
  const inventorySummary = stats?.inventory ?? { total: 0, low: 0, expiring: 0, expired: 0 };
  const alertTotal = inventorySummary.low + inventorySummary.expiring + inventorySummary.expired;

  const pieData = Object.entries(byStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || '#6B6A5F',
  }));

  const maxActivity = Math.max(1, ...laborantActivity.map((l) => l.count ?? 0));

  return (
    <div>
      <Title level={4} style={{ marginBottom: 2 }}>Dashboard</Title>
      <Text type="secondary">Laboratoriya faoliyatining umumiy ko'rinishi</Text>

      <Row gutter={[14, 14]} style={{ marginTop: 20 }}>
        <Col xs={12} md={6}>
          <StatCard label="Jami namunalar" value={totalSamples} hint={`+${newThisWeek} bu hafta`} />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            label="Jarayonda"
            value={inProgress}
            hint={`Tekshiruvda: ${experimentsPending}`}
            accent={{ bg: '#FBF0DD', color: '#8A5C15' }}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            label="Tugallangan"
            value={completed}
            hint={totalSamples ? `${Math.round((completed / totalSamples) * 100)}% ulushi` : undefined}
          />
        </Col>
        <Col xs={12} md={6}>
          <StatCard
            label="Reaktiv ogohlantirish"
            value={alertTotal}
            hint={
              alertTotal
                ? `Kam: ${inventorySummary.low} · Muddati tugayapti: ${inventorySummary.expiring} · O'tgan: ${inventorySummary.expired}`
                : "Muammo yo'q"
            }
            accent={
              alertTotal
                ? { bg: '#FBE9E6', color: '#8A2C21' }
                : { bg: '#E1F0EA', color: '#0B5744' }
            }
          />
        </Col>
      </Row>

      <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
        <Col xs={24} md={12}>
          <Card title="Holat bo'yicha taqsimot" bordered>
            {pieData.length ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 140, height: 140 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={62}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pieData.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.color }} />
                      <span style={{ color: 'var(--ink-soft)' }}>{entry.name}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", marginLeft: 'auto' }}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Hali statistika yo'q" subtitle="Namunalar qo'shilgach bu yerda ko'rinadi" />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Reaktiv ogohlantirishlari" bordered styles={{ body: { padding: 0 } }}>
            {alerts.length ? (
              <List
                dataSource={alerts.slice(0, 6)}
                renderItem={(item) => (
                  <List.Item style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Text style={{ fontSize: 13 }}>{item.name_uz}</Text>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: item.tone === 'red' ? '#FBE9E6' : '#FBF0DD',
                          color: item.tone === 'red' ? '#8A2C21' : '#8A5C15',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.reason}
                      </span>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <EmptyState title="Ogohlantirish yo'q" subtitle="Barcha reaktivlar yetarli miqdorda" />
            )}
          </Card>
        </Col>
      </Row>

      {laborantActivity.length > 0 && (
        <Row style={{ marginTop: 14 }}>
          <Col span={24}>
            <Card title="Laborant faolligi (so'nggi 30 kun)" bordered>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {laborantActivity.map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Text style={{ width: 160, fontSize: 12.5 }}>{l.name?.trim() || l.email}</Text>
                    <Progress
                      percent={Math.round(((l.count ?? 0) / maxActivity) * 100)}
                      showInfo={false}
                      strokeColor="#0F6E56"
                      style={{ flex: 1 }}
                    />
                    <Text style={{ width: 28, textAlign: 'right', fontSize: 12 }}>
                      {l.count ?? 0}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
