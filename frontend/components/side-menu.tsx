import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  XIcon,
  HouseIcon,
  PathIcon,
  StarIcon,
  NewspaperIcon,
  RobotIcon,
  BellIcon,
  GearSixIcon,
  LifebuoyIcon,
  SignOutIcon,
  type Icon,
} from 'phosphor-react-native';

import { useAuth } from '@/AuthContext';
import { getUserProfile } from '@/api';
import { ArrivoLogo } from '@/components/arrivo-logo';
import { Palette, Type } from '@/constants/theme';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

const primaryItems: { icon: Icon; label: string; href: string }[] = [
  { icon: HouseIcon, label: 'Home', href: '/(tabs)' },
  { icon: PathIcon, label: 'Timeline', href: '/(tabs)/timeline' },
  { icon: StarIcon, label: 'Milestones', href: '/(tabs)/milestones' },
  { icon: NewspaperIcon, label: 'News', href: '/(tabs)/news' },
  { icon: RobotIcon, label: 'AI Assistant', href: '/chat' },
];

const secondaryItems: { icon: Icon; label: string; href: string }[] = [
  { icon: BellIcon, label: 'Notifications', href: '/notification-settings' },
  { icon: GearSixIcon, label: 'Settings', href: '/settings' },
  { icon: LifebuoyIcon, label: 'Help & Support', href: '/dso-directory' },
];

function MenuRow({ icon: IconComponent, label, onPress }: { icon: Icon; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <IconComponent size={19} color={Palette.inkMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
    </Pressable>
  );
}

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<{ name?: string } | null>(null);
  const translateX = useSharedValue(286);

  useEffect(() => {
    translateX.value = withTiming(visible ? 0 : 286, {
      duration: 220,
      easing: Easing.out(Easing.ease),
    });
  }, [visible]);

  useEffect(() => {
    if (visible && user && token) {
      getUserProfile(user.id, token)
        .then(setProfile)
        .catch(() => {});
    }
  }, [visible, user, token]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const navigateTo = (href: string) => {
    onClose();
    router.push(href as never);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/welcome');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.panel, panelStyle]}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <ArrivoLogo size={28} />
            </View>
            <View style={styles.identity}>
              <Text style={styles.name} numberOfLines={1}>
                {profile?.name ?? 'Your account'}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email ?? ''}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <XIcon size={20} color={Palette.inkMuted} />
            </Pressable>
          </View>

          <View style={styles.group}>
            {primaryItems.map((item) => (
              <MenuRow key={item.label} icon={item.icon} label={item.label} onPress={() => navigateTo(item.href)} />
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.group}>
            {secondaryItems.map((item) => (
              <MenuRow key={item.label} icon={item.icon} label={item.label} onPress={() => navigateTo(item.href)} />
            ))}
          </View>

          <View style={styles.spacer} />

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed, styles.logoutRow]}>
            <SignOutIcon size={19} color={Palette.danger} />
            <Text style={styles.logoutLabel}>Log Out</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: Palette.scrim,
  },
  panel: {
    width: 286,
    backgroundColor: Palette.white,
    paddingTop: 62,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
  },
  name: {
    fontFamily: Type.headingSemiBold,
    fontSize: 14.5,
    color: Palette.ink,
  },
  email: {
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkPlaceholder,
    marginTop: 1,
  },
  group: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  rowPressed: {
    backgroundColor: Palette.menuRowPress,
  },
  rowLabel: {
    fontFamily: Type.bodyRegular,
    fontSize: 14.5,
    color: Palette.ink,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.divider,
    marginVertical: 12,
    marginHorizontal: 20,
  },
  spacer: {
    flex: 1,
  },
  logoutRow: {
    marginTop: 12,
  },
  logoutLabel: {
    fontFamily: Type.bodySemiBold,
    fontSize: 14.5,
    color: Palette.danger,
  },
});
