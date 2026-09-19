import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// Catatan: Firebase Cloud Storage TIDAK dipakai di project ini karena sejak
// 3 Februari 2026 Google mewajibkan paket berbayar (Blaze/kartu kredit)
// untuk memakai Storage, walau pemakaiannya tetap Rp0. Realtime Database
// tetap gratis penuh tanpa kartu kredit di paket Spark, jadi bukti transfer
// top-up disimpan sebagai gambar terkompresi (base64) langsung di Realtime
// Database -- lihat src/lib/image.js dan src/pages/driver/TopUp.jsx.

// Login berbasis ID (tanpa password) tetap memakai Firebase Auth di baliknya:
// setiap sesi browser sign-in anonim ke Firebase supaya security rules (yang
// membaca request.auth) tetap bisa mengecek identitas, sementara pengguna
// hanya mengetik ID mereka. UID anonim dipetakan ke ID Korwil/Driver melalui
// node `sessions/{uid}` -> { userId } yang dibuat saat login (lihat AuthContext).
export async function ensureFirebaseSession() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser;
}
