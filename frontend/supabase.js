import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rbhupvfnxxcrezxobjbz.supabase.co';
const supabaseAnonKey = 'sb_publishable_2xj1XVBVNKXCJ5bj4WiQMw_HQ82rdrL';

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
    // Only used for the Google/Apple/Microsoft OAuth handshake below — the
    // rest of the app manages its own session via AuthContext/AsyncStorage
    // against the custom backend, not this client's session.
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});
