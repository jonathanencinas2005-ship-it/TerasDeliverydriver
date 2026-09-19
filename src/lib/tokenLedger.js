import { ref, runTransaction, push, set, get, update } from 'firebase/database';
import { db } from '../firebase';
import { nextDailySequence, buildTransactionNumber } from './transactionNumber';
import { MULTI_STORE_FEE } from './regions';

// --- Saldo token -----------------------------------------------------------
// tokenBalances/{driverId} adalah angka cache yang SELALU dihitung ulang
// lewat operasi atomic (runTransaction), sehingga aman dari race condition.
// Riwayat lengkap & yang bisa diaudit tetap ada di tokenLedger/{driverId}/{id},
// yang menjadi sumber kebenaran (source of truth) untuk laporan/audit.
async function adjustTokenBalance(driverId, delta) {
  const balRef = ref(db, `tokenBalances/${driverId}`);
  const result = await runTransaction(balRef, (current) => (current || 0) + delta);
  if (!result.committed) throw new Error('Gagal memperbarui saldo token, coba lagi.');
  return result.snapshot.val();
}

async function appendLedgerEntry(driverId, entry) {
  const entryRef = push(ref(db, `tokenLedger/${driverId}`));
  await set(entryRef, { ...entry, createdAt: Date.now() });
  return entryRef.key;
}

// --- Membuat pesanan / order -----------------------------------------------
// stores: [{ name, items: [{ name, price, qty }] }]
export async function createOrder({
  regionCode, driverId, driverCode, customer, stores,
  deliveryRegion, deliveryFee, parking
}) {
  const now = Date.now();
  const sequence = await nextDailySequence(regionCode, driverCode, now);
  const transactionNumber = buildTransactionNumber({ regionCode, driverCode, atEpoch: now, sequence });

  const multiStoreFee = stores.length > 1 ? MULTI_STORE_FEE : 0;
  const goodsTotal = stores.reduce(
    (sum, s) => sum + s.items.reduce((si, it) => si + it.price * it.qty, 0),
    0
  );
  const total = goodsTotal + Number(deliveryFee || 0) + multiStoreFee + Number(parking || 0);

  const txRef = ref(db, `transactions/${transactionNumber.replace(/\//g, '-')}`);
  const record = {
    transactionNumber,
    regionCode,
    driverId,
    driverCode,
    createdAt: now,
    customer,
    stores,
    deliveryRegion,
    deliveryFee: Number(deliveryFee || 0),
    multiStoreFee,
    parking: Number(parking || 0),
    goodsTotal,
    total,
    tokenUsed: 1
  };
  await set(txRef, record);

  const newBalance = await adjustTokenBalance(driverId, -1);
  await appendLedgerEntry(driverId, {
    type: 'order',
    amount: -1,
    referenceId: record.transactionNumber,
    balanceAfter: newBalance
  });

  return { ...record, id: txRef.key, balanceAfter: newBalance };
}

// --- Top up: pengajuan, approve, tolak --------------------------------------
export async function submitTopUp({ driverId, driverCode, regionCode, amount, tokenAmount, proofData }) {
  const topUpRef = push(ref(db, 'topUps'));
  await set(topUpRef, {
    driverId, driverCode, regionCode,
    amount, tokenAmount, proofData,
    status: 'pending',
    createdAt: Date.now()
  });
  return topUpRef.key;
}

export async function approveTopUp({ topUpId, approvedByUserId }) {
  const snap = await get(ref(db, `topUps/${topUpId}`));
  if (!snap.exists()) throw new Error('Pengajuan top-up tidak ditemukan.');
  const topUp = snap.val();
  if (topUp.status !== 'pending') throw new Error('Pengajuan ini sudah diproses.');

  const newBalance = await adjustTokenBalance(topUp.driverId, topUp.tokenAmount);
  await appendLedgerEntry(topUp.driverId, {
    type: 'topup',
    amount: topUp.tokenAmount,
    referenceId: topUpId,
    balanceAfter: newBalance
  });
  await update(ref(db, `topUps/${topUpId}`), {
    status: 'approved',
    approvedBy: approvedByUserId,
    approvedAt: Date.now()
  });
  return newBalance;
}

export async function rejectTopUp({ topUpId, approvedByUserId, reason }) {
  await update(ref(db, `topUps/${topUpId}`), {
    status: 'rejected',
    approvedBy: approvedByUserId,
    approvedAt: Date.now(),
    rejectionReason: reason || ''
  });
}
