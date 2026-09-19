import { useRef, useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';
import { formatRupiah, formatDateTime } from '../../lib/format';

function buildReceiptText(t, settings) {
  const lines = [];
  lines.push(settings.businessName || 'TERAS DELIVERY');
  if (settings.address) lines.push(settings.address);
  if (settings.phone) lines.push(settings.phone);
  lines.push('--------------------------------');
  lines.push(t.transactionNumber);
  lines.push(formatDateTime(t.createdAt));
  lines.push('--------------------------------');
  t.stores.forEach((s) => {
    lines.push(s.name);
    s.items.forEach((it) => {
      lines.push(`${it.name} x${it.qty}  ${formatRupiah(it.price * it.qty)}`);
    });
  });
  lines.push('--------------------------------');
  lines.push(`Ongkir: ${formatRupiah(t.deliveryFee)}`);
  if (t.multiStoreFee) lines.push(`Beda Toko: ${formatRupiah(t.multiStoreFee)}`);
  if (t.parking) lines.push(`Parkir: ${formatRupiah(t.parking)}`);
  lines.push(`TOTAL: ${formatRupiah(t.total)}`);
  lines.push('--------------------------------');
  if (settings.footer) lines.push(settings.footer);
  return lines.join('\n');
}

export default function ReceiptModal({ transaction: t, onClose }) {
  const receiptRef = useRef(null);
  const [settings, setSettings] = useState({ businessName: 'TERAS DELIVERY', paperSize: '58' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, `regions/${t.regionCode}/receiptSettings`), (snap) => {
      if (snap.exists()) setSettings((s) => ({ ...s, ...snap.val() }));
    });
    return () => unsub();
  }, [t.regionCode]);

  async function handleCopy() {
    await navigator.clipboard.writeText(buildReceiptText(t, settings));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleDownloadJpeg() {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(receiptRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${t.transactionNumber}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  }

  const widthPx = settings.paperSize === '80' ? 320 : 232;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(16,49,92,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16
    }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 400, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div ref={receiptRef} style={{
            width: widthPx, background: '#fff', padding: 16, fontFamily: 'monospace', fontSize: '0.78rem', color: '#111'
          }}>
            <div style={{ textAlign: 'center', fontWeight: 700 }}>{settings.businessName}</div>
            {settings.address && <div style={{ textAlign: 'center' }}>{settings.address}</div>}
            {settings.phone && <div style={{ textAlign: 'center' }}>{settings.phone}</div>}
            <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
            <div>{t.transactionNumber}</div>
            <div>{formatDateTime(t.createdAt)}</div>
            <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
            {t.stores.map((s, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>{s.name}</div>
                {s.items.map((it, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{it.name} x{it.qty}</span>
                    <span>{formatRupiah(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ongkir</span><span>{formatRupiah(t.deliveryFee)}</span></div>
            {t.multiStoreFee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Beda Toko</span><span>{formatRupiah(t.multiStoreFee)}</span></div>}
            {t.parking > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Parkir</span><span>{formatRupiah(t.parking)}</span></div>}
            <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>TOTAL</span><span>{formatRupiah(t.total)}</span></div>
            {settings.footer && <div style={{ textAlign: 'center', marginTop: 8 }}>{settings.footer}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button className="btn btn-secondary btn-block" onClick={handleCopy}>{copied ? 'Tersalin!' : 'Copy Text'}</button>
          <button className="btn btn-primary btn-block" onClick={handleDownloadJpeg}>JPEG HD</button>
        </div>
        <button className="btn btn-ghost btn-block" onClick={onClose}>Tutup</button>
      </div>
    </div>
  );
}
