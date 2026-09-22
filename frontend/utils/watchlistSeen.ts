import AsyncStorage from '@react-native-async-storage/async-storage';

// Per-company "last time the user looked at this watch list" timestamps,
// used purely to compute the "New" badge client-side — the backend already
// tracks which postings it has notified about (internships_seen) but
// doesn't expose a per-company new-postings count, and this is frontend
// polish only, so this fills that gap locally instead.
const STORAGE_KEY = 'arriv0_watchlist_last_seen';

async function readAll(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getLastSeen(company: string): Promise<string | null> {
  const all = await readAll();
  return all[company] ?? null;
}

export async function markCompanySeen(company: string, when: Date = new Date()): Promise<void> {
  try {
    const all = await readAll();
    all[company] = when.toISOString();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // best-effort; worst case the "New" badge stays a little longer than it should
  }
}

export async function markCompaniesSeenNow(companies: string[]): Promise<void> {
  try {
    const all = await readAll();
    const now = new Date().toISOString();
    for (const company of companies) all[company] = now;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // best-effort
  }
}
