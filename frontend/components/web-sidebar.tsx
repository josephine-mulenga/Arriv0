import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import {
  HouseIcon,
  PathIcon,
  StarIcon,
  NewspaperIcon,
  BriefcaseIcon,
  UserIcon,
  AirplaneLandingIcon,
  type Icon,
} from 'phosphor-react-native';

import { Palette, Type } from '@/constants/theme';
import { DESKTOP_SIDEBAR_WIDTH } from '@/constants/layout';

const NAV_ITEMS: { pathname: '/' | '/timeline' | '/milestones' | '/news' | '/internships' | '/profile'; label: string; icon: Icon }[] = [
  { pathname: '/', label: 'Home', icon: HouseIcon },
  { pathname: '/timeline', label: 'Timeline', icon: PathIcon },
  { pathname: '/milestones', label: 'Milestones', icon: StarIcon },
  { pathname: '/news', label: 'News', icon: NewspaperIcon },
  { pathname: '/internships', label: 'Internships', icon: BriefcaseIcon },
  { pathname: '/profile', label: 'Profile', icon: UserIcon },
];

// Desktop-only persistent nav — replaces the bottom tab bar once the browser
// is wide enough (see WebShell). Native never renders this.
export function WebSidebar() {
  const pathname = usePathname();

  return (
    <View style={styles.root}>
      <View style={styles.logoRow}>
        <View style={styles.logoMark}>
          <AirplaneLandingIcon size={17} color={Palette.white} weight="fill" />
        </View>
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
              onPress={() => router.push(item.pathname)}>
              <IconComponent size={19} color={active ? Palette.purple : Palette.inkFaint} weight={active ? 'fill' : 'regular'} />
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
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
    backgroundColor: Palette.white,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontFamily: Type.headingBold,
    fontSize: 20,
    color: Palette.purple,
  },
  nav: {
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
});
