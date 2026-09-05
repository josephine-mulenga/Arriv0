import { Tabs, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  HouseIcon,
  PathIcon,
  StarIcon,
  NewspaperIcon,
  BriefcaseIcon,
  UserIcon,
  type Icon,
} from 'phosphor-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Palette, Type } from '@/constants/theme';
import { DESKTOP_BREAKPOINT } from '@/constants/layout';
import { useAuth } from '@/AuthContext';
import { registerForPushNotifications } from '@/utils/registerPushNotifications';

function TabIcon({ Icon: IconComponent, color, focused }: { Icon: Icon; color: string; focused: boolean }) {
  return <IconComponent size={21} color={color} weight={focused ? 'fill' : 'regular'} />;
}

function TabLabel({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.tabLabel, { color }]}>{label}</Text>;
}

export default function TabLayout() {
  const { user, token, initializing } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > DESKTOP_BREAKPOINT;

  useEffect(() => {
    if (user) {
      registerForPushNotifications(user.id, token);
    }
  }, [user]);

  if (initializing) {
    return null;
  }

  if (!user) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Palette.purple,
        tabBarInactiveTintColor: Palette.inkDisabled,
        // On desktop web, WebSidebar (rendered by WebShell, above this
        // navigator) replaces the bottom tab bar — hide it here so the two
        // navigation UIs never show up stacked on top of each other.
        tabBarStyle: isDesktopWeb ? styles.tabBarHidden : styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={HouseIcon} color={color} focused={focused} />,
          tabBarLabel: ({ color }) => <TabLabel label="Home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={PathIcon} color={color} focused={focused} />,
          tabBarLabel: ({ color }) => <TabLabel label="Timeline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          title: 'Milestones',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={StarIcon} color={color} focused={focused} />,
          tabBarLabel: ({ color }) => <TabLabel label="Milestones" color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={NewspaperIcon} color={color} focused={focused} />,
          tabBarLabel: ({ color }) => <TabLabel label="News" color={color} />,
        }}
      />
      <Tabs.Screen
        name="internships"
        options={{
          title: 'Internships',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={BriefcaseIcon} color={color} focused={focused} />,
          tabBarLabel: ({ color }) => <TabLabel label="Internships" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={UserIcon} color={color} focused={focused} />,
          tabBarLabel: ({ color }) => <TabLabel label="Profile" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: Palette.divider,
    paddingTop: 9,
    paddingBottom: 22,
    height: 78,
  },
  tabBarHidden: {
    display: 'none',
  },
  tabLabel: {
    fontFamily: Type.headingSemiBold,
    fontSize: 10.5,
    marginTop: 3,
  },
});
