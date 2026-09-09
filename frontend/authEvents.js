import { router } from 'expo-router';

let logoutHandler = null;

export const setLogoutHandler = (fn) => {
  logoutHandler = fn;
};

// Called only when the backend rejects a token (expired/invalid) — sends
// the user straight to the login form with an explanation, rather than
// leaving them on /welcome (the marketing homepage on web) wondering where
// the app went. A deliberate, user-initiated logout (side-menu) is a
// separate path and is unaffected.
export const triggerLogout = () => {
  if (logoutHandler) logoutHandler();
  router.replace('/login?sessionExpired=1');
};