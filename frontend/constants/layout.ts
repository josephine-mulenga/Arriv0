// Web-only desktop shell thresholds — native ignores all of this entirely.
export const WEB_NARROW_MAX_WIDTH = 520;
export const DESKTOP_BREAKPOINT = 900;
export const DESKTOP_SIDEBAR_WIDTH = 232;
export const DESKTOP_CONTENT_MAX_WIDTH = 1040;

// Canonical pathnames for the 6 tab screens — used to decide whether the
// current route gets the desktop sidebar shell or stays in the narrow
// single-column layout used by pushed detail screens (documents, chat, etc).
export const TAB_PATHNAMES = ['/', '/timeline', '/milestones', '/news', '/internships', '/profile'];
