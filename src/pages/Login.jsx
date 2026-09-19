import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/layout/AppLayout';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const profile = await login(id);
      navigate(profile.role === 'korwil' ? '/korwil' : '/driver');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: 'var(--white)', display: 'flex', flexDirection: 'column'
    }}>
      {/* Dekorasi geometris sudut, sesuai referensi */}
      <div style={{
        position: 'absolute', top: -60, right: -60, width: 220, height: 220,
        background: 'var(--blue-primary)', transform: 'rotate(45deg)', opacity: 0.95
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 160, height: 160,
        background: 'var(--blue-light)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
      }} />
      <div style={{
        position: 'absolute', bottom: -70, left: -70, width: 240, height: 240,
        background: 'var(--blue-primary)', transform: 'rotate(45deg)', opacity: 0.95
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: 170, height: 170,
        background: 'var(--blue-light)', clipPath: 'polygon(0 100%, 0 0, 100% 100%)'
      }} />

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', width: '100%', padding: '0 24px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Logo size={90} />
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.02em' }}>TERAS</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 700, fontSize: 12, letterSpacing: '0.08em' }}>
            PESAN, PROSES, HAPPY!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 28 }}>
          <div className="field">
            <label>ID Anda</label>
            <input
              className="input"
              placeholder="Contoh: TRS-003-02"
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoFocus
              autoCapitalize="characters"
            />
          </div>

          {error && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy || !id.trim()}>
            {busy ? 'Memeriksa...' : 'Simpan & Mulai'} {!busy && <ArrowRight size={16} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, marginBottom: 24 }}>
          Teras Delivery v1.0
        </p>
      </div>
    </div>
  );
}
