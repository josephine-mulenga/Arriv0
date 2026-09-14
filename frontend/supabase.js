import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://rbhupvfnxxcrezxobjbz.supabase.co';
export const supabaseAnonKey = 'sb_publishable_2xj1XVBVNKXCJ5bj4WiQMw_HQ82rdrL';

// AsyncStorage's web shim reaches for `window` directly with no guard,
// which crashes expo-router's web build during its initial Node-side
// render pass (no `window` there yet). Native is unaffected — this only
// changes behavior on web, and only during that pre-hydration pass.
const noopStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};
const authStorage = Platform.OS === 'web' && typeof window === 'undefined' ? noopStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // This client never holds a logged-in session for email/password users —
    // login only talks to the custom FastAPI backend, which manages its own
    // session via AuthContext/AsyncStorage. This client's own auth state is
    // only exercised by the password-reset code exchange
    // (reset-password-confirm.tsx). Storage uploads (api.js uploadAvatar)
    // authenticate by attaching the backend-issued JWT directly to the
    // request instead of relying on this client's session.
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});
