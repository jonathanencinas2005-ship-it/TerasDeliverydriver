import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ref, get, set, onValue } from 'firebase/database';
import { db, auth, ensureFirebaseSession } from '../firebase';

const AuthContext = createContext(null);
const STORAGE_KEY = 'teras_userId';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, role, name, regionCode, driverCode, active }
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (userId) => {
    const snap = await get(ref(db, `users/${userId}`));
    if (!snap.exists()) return null;
    return { id: userId, ...snap.val() };
  }, []);

  // Restore session on load
  useEffect(() => {
    let unsubProfile = null;
    (async () => {
      const savedId = localStorage.getItem(STORAGE_KEY);
      await ensureFirebaseSession();
      if (savedId) {
        const authedUid = auth.currentUser?.uid;
        if (authedUid) {
          await set(ref(db, `sessions/${authedUid}`), { userId: savedId, ts: Date.now() });
        }
        unsubProfile = onValue(ref(db, `users/${savedId}`), (snap) => {
          if (snap.exists()) {
            setUser({ id: savedId, ...snap.val() });
          } else {
            setUser(null);
            localStorage.removeItem(STORAGE_KEY);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    })();
    return () => unsubProfile && unsubProfile();
  }, []);

  const login = useCallback(async (rawId) => {
    const id = rawId.trim().toUpperCase();
    await ensureFirebaseSession();
    const profile = await loadUserProfile(id);
    if (!profile) throw new Error('ID tidak ditemukan. Periksa kembali ID Anda.');
    if (profile.active === false) throw new Error('Akun ini nonaktif. Hubungi Korwil.');
    const uid = auth.currentUser.uid;
    await set(ref(db, `sessions/${uid}`), { userId: id, ts: Date.now() });
    localStorage.setItem(STORAGE_KEY, id);
    setUser(profile);
    return profile;
  }, [loadUserProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
