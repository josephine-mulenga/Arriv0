import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/pressable-scale';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { Palette, Type } from '@/constants/theme';
import { hasEverChatted } from '@/utils/chatUsage';

const TOOLTIP_SHOWN_KEY = 'arriv0_ask_arri_tooltip_shown';
const BOUNCE_INTERVAL_MS = 30000;

// Persistent shortcut into chat from every tab screen — hidden on chat
// itself (tapping it there would just re-push the same screen) and while
// the tab bar transitions, so it never floats over its own destination.
//
// Until the user has actually sent a first chat message, it works harder to
// get noticed: a continuous subtle pulse, a one-time tooltip on first
// launch, and a gentle bounce every 30s. All of that stops for good the
// moment markHasChatted() fires (see chat.tsx's handleSend) — this
// component re-checks AsyncStorage on every route change, so it settles
// down as soon as the user comes back from their first real conversation.
export function FloatingAskArri() {
  const pathname = usePathname();
  const [hasChatted, setHasChatted] = useState<boolean | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);
  const tooltipOpacity = useSharedValue(0);

  useEffect(() => {
    hasEverChatted().then(setHasChatted);
  }, [pathname]);

  useEffect(() => {
    if (hasChatted !== false) return undefined;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    AsyncStorage.getItem(TOOLTIP_SHOWN_KEY).then((shown) => {
      if (shown) return;
      setShowTooltip(true);
      tooltipOpacity.value = withTiming(1, { duration: 300 });
      setTimeout(() => {
        tooltipOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) runOnJS(setShowTooltip)(false);
        });
      }, 4500);
      AsyncStorage.setItem(TOOLTIP_SHOWN_KEY, 'true');
    });

    const interval = setInterval(() => {
      bounce.value = withSequence(
        withTiming(-12, { duration: 160, easing: Easing.out(Easing.ease) }),
        withSpring(0, { damping: 5, stiffness: 260 })
      );
    }, BOUNCE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      scale.value = 1;
    };
  }, [hasChatted]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: bounce.value }],
  }));
  const tooltipAnimatedStyle = useAnimatedStyle(() => ({ opacity: tooltipOpacity.value }));

  if (pathname === '/chat') return null;

  const discoverable = hasChatted === false;

  return (
    <>
      {showTooltip && (
        <Animated.View style={[styles.tooltip, tooltipAnimatedStyle]} pointerEvents="none">
          <Text style={styles.tooltipText}>Ask me anything about immigration</Text>
          <Animated.View style={styles.tooltipArrow} />
        </Animated.View>
      )}
      <Animated.View style={[styles.buttonWrap, buttonAnimatedStyle]}>
        <PressableScale
          style={[styles.button, discoverable && styles.buttonDiscoverable]}
          onPress={() => router.push('/chat')}
          scaleTo={0.88}>
          <ArrivoLogo size={discoverable ? 28 : 26} />
        </PressableScale>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  buttonWrap: {
    position: 'absolute',
    right: 18,
    bottom: 96,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
  },
  buttonDiscoverable: {
    width: 62,
    height: 62,
    borderRadius: 31,
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 10,
    borderColor: Palette.purple,
    borderWidth: 1.5,
  },
  tooltip: {
    position: 'absolute',
    right: 14,
    bottom: 162,
    maxWidth: 190,
    backgroundColor: Palette.ink,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  tooltipText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    lineHeight: 17,
    color: Palette.white,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    right: 22,
    width: 12,
    height: 12,
    backgroundColor: Palette.ink,
    transform: [{ rotate: '45deg' }],
  },
});
