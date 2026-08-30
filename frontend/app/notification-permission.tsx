import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BellIcon, CheckIcon } from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { OutlineButton } from '@/components/ui/outline-button';
import { Palette, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { registerForPushNotifications } from '@/utils/registerPushNotifications';

export default function NotificationPermissionScreen() {
  const { user, token } = useAuth();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2250, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2250, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const goHome = () => router.replace('/(tabs)');

  const handleEnable = async () => {
    if (user) {
      await registerForPushNotifications(user.id, token);
    }
    goHome();
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.iconWrap, floatStyle]}>
        <View style={styles.iconSquare}>
          <BellIcon size={66} color={Palette.purple} weight="fill" />
        </View>
        <View style={styles.badge}>
          <CheckIcon size={20} color={Palette.white} weight="bold" />
        </View>
      </Animated.View>

      <Text style={styles.title}>Stay updated</Text>

      <Text style={styles.body}>
        Allow notifications so you never miss important deadlines, milestones and immigration
        updates.
      </Text>

      <View style={styles.spacer} />

      <View style={styles.buttonBlock}>
        <PrimaryButton label="Enable Notifications" onPress={handleEnable} />
        <OutlineButton label="Maybe Later" onPress={goHome} style={styles.laterButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 34,
  },
  iconWrap: {
    width: 132,
    height: 132,
  },
  iconSquare: {
    width: 132,
    height: 132,
    borderRadius: 42,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.purple,
    borderWidth: 4,
    borderColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 30,
    fontFamily: Type.headingBold,
    fontSize: 27,
    color: Palette.ink,
  },
  body: {
    marginTop: 16,
    fontFamily: Type.bodyRegular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    color: Palette.inkMuted,
    maxWidth: 280,
  },
  spacer: {
    flex: 1,
  },
  buttonBlock: {
    width: '100%',
    paddingBottom: 40,
  },
  laterButton: {
    marginTop: 11,
  },
});
