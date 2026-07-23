// GHS xavflilik darajasi: 1 (past) — 4 (yuqori)
const LEVEL_CFG = {
  1: { label: 'GHS 1', bg: '#E1F0EA', color: '#0B5744' },
  2: { label: 'GHS 2', bg: '#E7EFF5', color: '#2B6693' },
  3: { label: 'GHS 3', bg: '#FBF0DD', color: '#8A5C15' },
  4: { label: 'GHS 4', bg: '#FBE9E6', color: '#8A2C21' },
};

export default function HazardBadge({ level }) {
  const cfg = LEVEL_CFG[level] || LEVEL_CFG[1];
  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}
