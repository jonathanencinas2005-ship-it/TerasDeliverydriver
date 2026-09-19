import { useMemo, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { formatRupiah } from '../../lib/format';

export default function RegionPicker({ zones, value, onChange }) {
  const [query, setQuery] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualFee, setManualFee] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter((z) => z.name.toLowerCase().includes(q));
  }, [zones, query]);

  if (manualMode) {
    return (
      <div className="field">
        <label>Wilayah Lain / Manual</label>
        <input
          className="input"
          placeholder="Nama wilayah"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
        />
        <input
          className="input"
          style={{ marginTop: 8 }}
          type="number"
          placeholder="Ongkir manual (Rp)"
          value={manualFee}
          onChange={(e) => setManualFee(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (!manualName || !manualFee) return;
              onChange({ name: manualName, fee: Number(manualFee), isManual: true });
              setManualMode(false);
            }}
          >
            Gunakan Wilayah Ini
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setManualMode(false)}>
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="field">
      <label>Wilayah Pengantaran</label>
      {value ? (
        <div className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{value.name}</div>
            <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{formatRupiah(value.fee)}</div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => onChange(null)}>Ganti</button>
        </div>
      ) : (
        <>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Cari wilayah pengantaran..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 8, border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}>
            {filtered.map((z) => (
              <button
                key={z.name}
                type="button"
                onClick={() => onChange(z)}
                style={{
                  display: 'flex', justifyContent: 'space-between', width: '100%',
                  padding: '12px 14px', background: 'var(--white)', border: 0,
                  borderBottom: '1px solid var(--line)', textAlign: 'left', fontWeight: 500
                }}
              >
                <span>{z.name}</span>
                <span style={{ color: 'var(--ink-soft)' }}>{formatRupiah(z.fee)}</span>
              </button>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ padding: '12px 14px', justifyContent: 'flex-start', gap: 8 }}
              onClick={() => setManualMode(true)}
            >
              <MapPin size={16} /> Wilayah Lain / Manual
            </button>
          </div>
        </>
      )}
    </div>
  );
}
