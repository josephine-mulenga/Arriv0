/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Arriv0 v2 design tokens — see design_handoff_arrivo_v2/README.md.
// White grounds throughout; purple is an accent only (buttons, active states,
// icons, and the two tinted cards) — never a large fill.
export const Palette = {
  purple: '#6C63FF',
  purpleDark: '#574FE0',
  purpleTint: '#F1EFFF',
  purpleCard: '#F4F2FF',
  purpleCardBorder: '#E7E3FB',
  ink: '#1A1A2E',
  inkBody: '#4A4A6A',
  inkMuted: '#6A6A85',
  inkFaint: '#7A7A93',
  inkPlaceholder: '#9A9AB0',
  inkDisabled: '#B0AEC4',
  chevron: '#C4C0DC',
  border: '#EBE9F6',
  borderPress: '#CFC9F5',
  borderInput: '#E4E2F2',
  divider: '#F2F1F9',
  dividerLight: '#F5F4FB',
  track: '#EEECF9',
  surfaceSubtle: '#FCFCFE',
  white: '#FFFFFF',
  green: '#2FB574',
  greenTint: '#EAF7F1',
  amber: '#D9922B',
  amberTint: '#FFFBF2',
  amberBorder: '#F2E3C4',
  red: '#D3524F',
  redTint: '#FDECEC',
  danger: '#E5484D',
  menuRowPress: '#F7F6FC',
  scrim: 'rgba(26,26,46,0.35)',
} as const;

// Fredoka (headings, buttons, tab labels, card titles) and Nunito Sans (body,
// metadata, input text) — loaded via expo-font in app/_layout.tsx.
export const Type = {
  headingMedium: 'Fredoka_500Medium',
  headingSemiBold: 'Fredoka_600SemiBold',
  headingBold: 'Fredoka_700Bold',
  bodyRegular: 'NunitoSans_400Regular',
  bodySemiBold: 'NunitoSans_600SemiBold',
  bodyBold: 'NunitoSans_700Bold',
} as const;

export const Spacing = {
  screenPadding: 20,
  screenPaddingOnboarding: 26,
  screenPaddingPaywall: 24,
  topPadding: 62,
  cardGap: 10,
  sectionGap: 22,
  cardPaddingSmall: 14,
  cardPaddingLarge: 18,
} as const;

export const Radius = {
  button: 16,
  cardSmall: 14,
  cardLarge: 20,
  input: 12,
  chip: 10,
  iconTile: 12,
  avatar: 999,
  phoneScreen: 42,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
