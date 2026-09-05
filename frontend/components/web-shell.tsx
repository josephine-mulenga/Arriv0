import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { usePathname } from 'expo-router';

import { Palette } from '@/constants/theme';
import {
  WEB_NARROW_MAX_WIDTH,
  DESKTOP_BREAKPOINT,
  DESKTOP_SIDEBAR_WIDTH,
  DESKTOP_CONTENT_MAX_WIDTH,
  TAB_PATHNAMES,
  AUTH_PATHNAMES,
  WIDE_CONTENT_ROUTES,
} from '@/constants/layout';
import { WebSidebar } from '@/components/web-sidebar';
import { WebAuthPanel } from '@/components/web-auth-panel';

// On native this is a total no-op passthrough — zero visual change to the
// phone apps. On web, this renders ONE stable tree shape at all times (only
// style values and which optional slot is populated ever change) so that
// resizing the window or navigating between routes never unmounts/remounts
// the Stack navigator underneath — that would reset navigation history and
// app state.
//
// Modes, by width and route:
//  - narrow (phone-width browser): full-bleed, identical to native — no shell.
//  - medium/desktop on a pushed detail screen (documents, chat, etc): the
//    original centered phone-width column with a hairline border.
//  - desktop on one of the 6 tab screens: persistent left sidebar nav
//    (replacing the bottom tab bar — see (tabs)/_layout.tsx) + a wider
//    centered content column.
//  - desktop on the auth/onboarding flow: a branding panel fills the space
//    beside the form instead of empty backdrop.
export function WebShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const isNarrow = width <= WEB_NARROW_MAX_WIDTH;
  const isDesktop = !isNarrow && width > DESKTOP_BREAKPOINT;
  const showSidebar = isDesktop && TAB_PATHNAMES.includes(pathname);
  const showAuthPanel = isDesktop && !showSidebar && AUTH_PATHNAMES.includes(pathname);
  const wideContentRoute = isDesktop && WIDE_CONTENT_ROUTES.find((r) => r.pathname === pathname);
  const contentMaxWidth = isNarrow
    ? undefined
    : showSidebar
      ? DESKTOP_CONTENT_MAX_WIDTH
      : wideContentRoute
        ? wideContentRoute.maxWidth
        : WEB_NARROW_MAX_WIDTH;

  return (
    <View style={styles.root}>
      <View style={[styles.sidebarSlot, { width: showSidebar ? DESKTOP_SIDEBAR_WIDTH : 0 }]}>
        {showSidebar && <WebSidebar />}
      </View>
      <View style={[styles.authPanelSlot, { flex: showAuthPanel ? 1 : 0 }]}>
        {showAuthPanel && <WebAuthPanel showBranding={pathname !== '/welcome' && pathname !== '/intro'} />}
      </View>
      <View style={[styles.contentOuter, isNarrow && styles.contentOuterNarrow]}>
        <View
          style={[
            styles.contentInner,
            contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
            !isNarrow && !showSidebar && styles.contentInnerBordered,
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
  authPanelSlot: {
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
  contentInner: {
    flex: 1,
    width: '100%',
    backgroundColor: Palette.white,
  },
  contentInnerBordered: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Palette.border,
  },
});
