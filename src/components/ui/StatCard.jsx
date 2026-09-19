export default function StatCard({ label, value, tone = 'default', icon: Icon }) {
  const toneColor = {
    default: 'var(--text-primary)',
    good: 'var(--success)',
    bad: 'var(--danger)',
    brand: 'var(--blue-primary)'
  }[tone];

  return (
    <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      {Icon && <div className="icon-circle"><Icon size={18} /></div>}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: toneColor, marginTop: 2 }}>
          {value}
        </div>
      </div>
    </div>
  );
}
