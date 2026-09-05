// Web-only desktop shell thresholds — native ignores all of this entirely.
export const WEB_NARROW_MAX_WIDTH = 520;
export const DESKTOP_BREAKPOINT = 900;
export const DESKTOP_SIDEBAR_WIDTH = 232;
export const DESKTOP_CONTENT_MAX_WIDTH = 1040;

// Pushed (non-tab, non-auth) screens default to the narrow WEB_NARROW_MAX_WIDTH
// column on desktop. A screen that's a real, frequently-used destination —
// not a lightweight settings/detail page — can opt into a wider column here
// without getting the full sidebar nav treatment.
export const WIDE_CONTENT_ROUTES: { pathname: string; maxWidth: number }[] = [
  { pathname: '/chat', maxWidth: 820 },
];

// Canonical pathnames for the 6 tab screens — used to decide whether the
// current route gets the desktop sidebar shell or stays in the narrow
// single-column layout used by pushed detail screens (documents, chat, etc).
export const TAB_PATHNAMES = ['/', '/timeline', '/milestones', '/news', '/internships', '/profile'];

// Pre-login/onboarding flow — gets a branding panel beside the form on
// desktop instead of empty backdrop.
export const AUTH_PATHNAMES = [
  '/welcome',
  '/intro',
  '/signup',
  '/login',
  '/personalize-profile',
  '/notification-permission',
  '/reset-password',
];
