const SAMPLE_STATUS_MAP = {
  received: { label: "Qabul qilindi", bg: '#E7EFF5', color: '#2B6693', dot: '#2B6693' },
  in_progress: { label: 'Jarayonda', bg: '#FBF0DD', color: '#8A5C15', dot: '#B9791F' },
  completed: { label: 'Tugallandi', bg: '#E1F0EA', color: '#0B5744', dot: '#0F6E56' },
  archived: { label: 'Arxivlandi', bg: '#EFEEE7', color: '#6B6A5F', dot: '#6B6A5F' },
};

const EXPERIMENT_STATUS_MAP = {
  draft: { label: 'Loyiha', bg: '#EFEEE7', color: '#6B6A5F', dot: '#6B6A5F' },
  in_progress: { label: 'Jarayonda', bg: '#FBF0DD', color: '#8A5C15', dot: '#B9791F' },
  review: { label: 'Tekshiruvda', bg: '#E7EFF5', color: '#2B6693', dot: '#2B6693' },
  approved: { label: 'Tasdiqlangan', bg: '#E1F0EA', color: '#0B5744', dot: '#0F6E56' },
  rejected: { label: 'Rad etilgan', bg: '#FBE9E6', color: '#8A2C21', dot: '#A63A2E' },
};

export function SampleStatusChip({ status }) {
  const cfg = SAMPLE_STATUS_MAP[status] || { label: status, bg: '#EFEEE7', color: '#6B6A5F', dot: '#6B6A5F' };
  return (
    <span className="status-chip" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="status-chip__dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export function ExperimentStatusChip({ status }) {
  const cfg = EXPERIMENT_STATUS_MAP[status] || { label: status, bg: '#EFEEE7', color: '#6B6A5F', dot: '#6B6A5F' };
  return (
    <span className="status-chip" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="status-chip__dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export const SAMPLE_STATUS_OPTIONS = Object.entries(SAMPLE_STATUS_MAP).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));
