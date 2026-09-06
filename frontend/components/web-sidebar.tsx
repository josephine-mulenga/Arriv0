import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import {
  HouseIcon,
  PathIcon,
  StarIcon,
  NewspaperIcon,
  BriefcaseIcon,
  UserIcon,
  FolderSimpleIcon,
  BuildingsIcon,
  ChatCenteredDotsIcon,
  type Icon,
} from 'phosphor-react-native';

import { ArrivoLogo } from '@/components/arrivo-logo';
import { useAuth } from '@/AuthContext';
import { Palette, Type } from '@/constants/theme';
import { DESKTOP_SIDEBAR_WIDTH } from '@/constants/layout';

const NAV_ITEMS: { pathname: string; label: string; icon: Icon }[] = [
  { pathname: '/', label: 'Home', icon: HouseIcon },
  { pathname: '/timeline', label: 'Timeline', icon: PathIcon },
  { pathname: '/milestones', label: 'Milestones', icon: StarIcon },
  { pathname: '/news', label: 'News', icon: NewspaperIcon },
  { pathname: '/internships', label: 'Internships', icon: BriefcaseIcon },
  { pathname: '/documents', label: 'Documents', icon: FolderSimpleIcon },
  { pathname: '/dso-directory', label: 'DSO Directory', icon: BuildingsIcon },
  { pathname: '/chat', label: 'Ask Arri', icon: ChatCenteredDotsIcon },
  { pathname: '/profile', label: 'Profile', icon: UserIcon },
];

function getInitial(email?: string): string {
  return email?.trim()?.[0]?.toUpperCase() ?? '?';
}

export function WebSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <View style={styles.root}>
      <View style={styles.logoRow}>
        <ArrivoLogo size={28} />
        <Text style={styles.logo}>Arriv0</Text>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.pathname;
          const IconComponent = item.icon;
          return (
            <Pressable
              key={item.pathname}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => router.push(item.pathname as never)}>
              <IconComponent size={19} color={active ? Palette.purple : Palette.inkFaint} weight={active ? 'fill' : 'regular'} />
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.userRow} onPress={() => router.push('/profile')}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitial(user?.email)}</Text>
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user?.email ?? 'My account'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: DESKTOP_SIDEBAR_WIDTH,
    borderRightWidth: 1,
    borderRightColor: Palette.border,
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Palette.white,
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  logo: {
    fontFamily: Type.headingBold,
    fontSize: 20,
    color: Palette.purple,
  },
  nav: {
    flex: 1,
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: Palette.purpleTint,
  },
  label: {
    fontFamily: Type.bodySemiBold,
    fontSize: 14,
    color: Palette.inkMuted,
  },
  labelActive: {
    color: Palette.purple,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.dividerLight,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Type.headingSemiBold,
    fontSize: 13,
    color: Palette.purple,
  },
  userEmail: {
    flex: 1,
    fontFamily: Type.bodySemiBold,
    fontSize: 12.5,
    color: Palette.inkBody,
  },
});
