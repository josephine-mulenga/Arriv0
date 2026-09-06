// Web-only desktop shell thresholds — native ignores all of this entirely.
export const WEB_NARROW_MAX_WIDTH = 520;
export const DESKTOP_BREAKPOINT = 900;
export const DESKTOP_SIDEBAR_WIDTH = 232;
export const DESKTOP_CONTENT_MAX_WIDTH = 1040;

// Pushed (non-sidebar, non-auth) screens default to the narrow
// WEB_NARROW_MAX_WIDTH column on desktop. A screen that's a real,
// frequently-used destination — not a lightweight settings/detail page —
// can opt into a wider column here without getting the full sidebar nav
// treatment. (Chat isn't here — see SIDEBAR_PATHNAMES below, it gets the
// sidebar + full desktop content width instead.)
export const WIDE_CONTENT_ROUTES: { pathname: string; maxWidth: number }[] = [];

// Canonical pathnames for the 6 tab screens — used by (tabs)/_layout.tsx to
// hide React Navigation's own bottom tab bar on desktop (the sidebar
// replaces it). Pushed screens like Documents/Chat aren't inside the Tabs
// navigator at all, so that check only ever needs these 6.
export const TAB_PATHNAMES = ['/', '/timeline', '/milestones', '/news', '/internships', '/profile'];

// Every route that keeps the persistent desktop sidebar visible — the 6 tabs
// plus a few frequently-used pushed screens the sidebar links to directly.
// Broader than TAB_PATHNAMES so the sidebar doesn't disappear the moment you
// open Documents or Chat from it.
export const SIDEBAR_PATHNAMES = [...TAB_PATHNAMES, '/documents', '/dso-directory', '/chat'];

// Pre-login/onboarding flow — gets a branding panel beside the form on
// desktop instead of empty backdrop. /welcome is deliberately excluded: on
// web it renders its own full-bleed marketing landing page (WebLandingPage)
// that manages its own width, not a narrow form column.
export const AUTH_PATHNAMES = [
  '/intro',
  '/signup',
  '/login',
  '/personalize-profile',
  '/notification-permission',
  '/reset-password',
];

// Routes that render their own complete full-width web layout — WebShell
// should apply zero chrome (no sidebar, no side panel, no narrow column).
export const FULL_BLEED_PATHNAMES = ['/welcome'];
