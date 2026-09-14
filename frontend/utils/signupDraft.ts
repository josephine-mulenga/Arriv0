// Holds the signup password in memory only, between the signup and
// personalize-profile screens. router.push params get serialized into the
// URL on the web export (and into PostHog's default pageview autocapture),
// so the password travels here instead of through navigation params.
let pendingPassword: string | null = null;

export function setPendingPassword(password: string) {
  pendingPassword = password;
}

export function takePendingPassword(): string | null {
  const value = pendingPassword;
  pendingPassword = null;
  return value;
}
