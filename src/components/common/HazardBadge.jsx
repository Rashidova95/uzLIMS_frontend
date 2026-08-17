// GHS xavflilik darajasi: 1 (past) — 4 (juda yuqori).
// Backend'dagi Chemical.HAZARD_CHOICES bilan bir xil so'zlar ishlatiladi.
const LEVEL_CFG = {
  1: { label: "Past xavf", bg: '#E1F0EA', color: '#0B5744' },
  2: { label: "O'rta xavf", bg: '#E7EFF5', color: '#2B6693' },
  3: { label: 'Yuqori xavf', bg: '#FBF0DD', color: '#8A5C15' },
  4: { label: 'Juda yuqori xavf', bg: '#FBE9E6', color: '#8A2C21' },
};

export default function HazardBadge({ level }) {
  const cfg = LEVEL_CFG[level] || LEVEL_CFG[1];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11.5,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
      <span className="mono" style={{ opacity: 0.6, fontWeight: 500, fontSize: 10 }}>
        GHS {level}
      </span>
    </span>
  );
}