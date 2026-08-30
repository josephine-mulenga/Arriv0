import AsyncStorage from '@react-native-async-storage/async-storage';

// Per-deadline checklist completion. There is no backend endpoint for this
// (see design_handoff_arrivo_v2/README.md's State Management table), so it
// persists locally on-device, keyed by deadline id then step key.
const STORAGE_KEY = 'deadlineStepCompletion';

export type StepCompletionMap = Record<string, Record<string, boolean>>;

export async function getStepCompletion(deadlineId: string): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const all: StepCompletionMap = raw ? JSON.parse(raw) : {};
    return all[deadlineId] ?? {};
  } catch {
    return {};
  }
}

export async function setStepCompletion(
  deadlineId: string,
  stepKey: string,
  done: boolean
): Promise<Record<string, boolean>> {
  let all: StepCompletionMap = {};
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    all = raw ? JSON.parse(raw) : {};
  } catch {
    all = {};
  }
  const forDeadline = { ...(all[deadlineId] ?? {}), [stepKey]: done };
  all[deadlineId] = forDeadline;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // best-effort persistence; in-memory state in the caller still updates
  }
  return forDeadline;
}
