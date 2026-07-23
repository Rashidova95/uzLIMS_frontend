import { ExperimentOutlined } from '@ant-design/icons';

export default function EmptyState({ title = "Hozircha ma'lumot yo'q", subtitle, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        color: 'var(--ink-soft)',
        textAlign: 'center',
      }}
    >
      <ExperimentOutlined style={{ fontSize: 28, color: 'var(--hairline)', marginBottom: 12 }} />
      <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>{subtitle}</div>}
      {action}
    </div>
  );
}
