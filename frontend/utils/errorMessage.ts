// A backend HTTPException detail is normally already user-safe (see
// extractErrorMessage in api.js), but this is the last line of defense
// before an error reaches the screen — it catches raw network failures and
// anything that smells like a technical/internal message (Supabase/Postgrest
// codes, stack traces, an email address) and swaps in plain, friendly copy
// instead of ever showing that to a student.
const TECHNICAL_PATTERN = /[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}|supabase|postgrest|traceback|stack trace|sql|constraint|duplicate key|null value|column ".*" of relation|\bpgrst\d+\b/i;
const NETWORK_PATTERN = /network|fetch|failed to fetch|timeout|timed out/i;

export function friendlyErrorMessage(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (!message) return fallback;
  if (NETWORK_PATTERN.test(message)) {
    return 'Could not connect. Please check your internet and try again.';
  }
  if (TECHNICAL_PATTERN.test(message)) {
    return fallback;
  }
  return message;
}
