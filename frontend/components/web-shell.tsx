import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { usePathname } from 'expo-router';

import { Palette } from '@/constants/theme';
import {
  WEB_NARROW_MAX_WIDTH,
  DESKTOP_BREAKPOINT,
  DESKTOP_SIDEBAR_WIDTH,
  DESKTOP_CONTENT_MAX_WIDTH,
  AUTH_CARD_MAX_WIDTH,
  SIDEBAR_PATHNAMES,
  AUTH_PATHNAMES,
  WIDE_CONTENT_ROUTES,
  FULL_BLEED_PATHNAMES,
} from '@/constants/layout';
import { WebSidebar } from '@/components/web-sidebar';

// On native this is a total no-op passthrough — zero visual change to the
// phone apps. On web, this renders ONE stable tree shape at all times (only
// style values ever change) so that resizing the window or navigating
// between routes never unmounts/remounts the Stack navigator underneath —
// that would reset navigation history and app state.
//
// Modes, by width and route:
//  - narrow (phone-width browser): full-bleed, identical to native — no shell.
//  - /welcome on web: full-bleed too — it renders its own marketing landing
//    page (WebLandingPage), not the phone welcome screen.
//  - desktop on a SIDEBAR_PATHNAMES route (the 6 tabs, Documents, DSO
//    Directory, Chat): persistent left sidebar nav (replacing the bottom
//    tab bar — see (tabs)/_layout.tsx) + a wider centered content column.
//  - desktop/tablet on the auth/onboarding flow (intro, signup, login,
//    etc): a single floating white card, centered on a soft backdrop — no
//    side panel, just the one screen, presented properly for a browser.
//  - anything else pushed (settings, feedback, contact-us, etc): a plain
//    centered phone-width column with a hairline border.
export function WebShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const isNarrow = width <= WEB_NARROW_MAX_WIDTH;
  const isFullBleed = FULL_BLEED_PATHNAMES.includes(pathname);
  const isChromeless = isNarrow || isFullBleed;
  const isDesktop = !isNarrow && width > DESKTOP_BREAKPOINT;
  const showSidebar = isDesktop && SIDEBAR_PATHNAMES.includes(pathname);
  const isCard = !isChromeless && !showSidebar && AUTH_PATHNAMES.includes(pathname);
  const wideContentRoute = isDesktop && WIDE_CONTENT_ROUTES.find((r) => r.pathname === pathname);
  const contentMaxWidth = isChromeless
    ? undefined
    : showSidebar
      ? DESKTOP_CONTENT_MAX_WIDTH
      : isCard
        ? AUTH_CARD_MAX_WIDTH
        : wideContentRoute
          ? wideContentRoute.maxWidth
          : WEB_NARROW_MAX_WIDTH;

  return (
    <View style={styles.root}>
      <View style={[styles.sidebarSlot, { width: showSidebar ? DESKTOP_SIDEBAR_WIDTH : 0 }]}>
        {showSidebar && <WebSidebar />}
      </View>
      <View style={[styles.contentOuter, isChromeless && styles.contentOuterNarrow, isCard && styles.contentOuterCard]}>
        <View
          style={[
            styles.contentInner,
            !isCard && styles.contentInnerStretch,
            contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
            !isChromeless && !showSidebar && !isCard && styles.contentInnerBordered,
            isCard && styles.contentInnerCard,
          ]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Palette.white,
  },
  sidebarSlot: {
    overflow: 'hidden',
  },
  contentOuter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Palette.dividerLight,
  },
  contentOuterNarrow: {
    backgroundColor: Palette.white,
  },
  contentOuterCard: {
    justifyContent: 'center',
    paddingVertical: 40,
  },
  contentInner: {
    width: '100%',
    backgroundColor: Palette.white,
  },
  contentInnerStretch: {
    flex: 1,
  },
  contentInnerBordered: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Palette.border,
  },
  contentInnerCard: {
    maxHeight: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(108,99,255,0.14)',
  },
});
