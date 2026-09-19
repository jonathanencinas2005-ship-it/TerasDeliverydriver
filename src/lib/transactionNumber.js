import { ref, runTransaction } from 'firebase/database';
import { db } from '../firebase';
import { jakartaDateKey, jakartaDateShort } from './format';

// Urutan harian disimpan di counters/{regionCode}/{driverCode}/{dateKey}.
// runTransaction menjamin aman terhadap dua device yang membuat transaksi
// bersamaan (concurrent writes) -- Firebase akan retry otomatis bila terjadi
// konflik, sehingga urutan tidak pernah bertabrakan atau terlompat.
export async function nextDailySequence(regionCode, driverCode, atEpoch = Date.now()) {
  const dateKey = jakartaDateKey(atEpoch);
  const counterRef = ref(db, `counters/${regionCode}/${driverCode}/${dateKey}`);
  const result = await runTransaction(counterRef, (current) => (current || 0) + 1);
  if (!result.committed) throw new Error('Gagal membuat nomor transaksi, coba lagi.');
  return result.snapshot.val(); // 1, 2, 3, ...
}

export function buildTransactionNumber({ regionCode, driverCode, atEpoch, sequence }) {
  const seq = String(sequence).padStart(3, '0');
  const dateStr = jakartaDateShort(atEpoch);
  return `TRX-${regionCode}-${driverCode}-${dateStr}-${seq}`;
}
