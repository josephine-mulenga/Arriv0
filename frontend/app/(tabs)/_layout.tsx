import { Tabs, Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import {
  HouseIcon,
  PathIcon,
  NewspaperIcon,
  BriefcaseIcon,
  UserIcon,
  type Icon,
} from 'phosphor-react-native';

import { HapticTab } from '@/components/haptic-tab';
import { FloatingAskArri } from '@/components/floating-ask-arri';
import { FirstTimeWalkthrough } from '@/components/first-time-walkthrough';
import { Palette, Type } from '@/constants/theme';
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
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    if (user) {
      registerForPushNotifications(user.id, token);
    }
  }, [user]);

  // First-time walkthrough: 'show_walkthrough' is set exactly once, by
  // personalize-profile.tsx right after a brand-new signup completes -
  // login.tsx never sets it, so an existing user logging in never sees
  // this, no matter how many times they log in. 'walkthrough_completed' is
  // the permanent record that it already ran, checked here as a second
  // guard against ever showing it twice for the same install.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const completed = await AsyncStorage.getItem('walkthrough_completed');
      if (completed) return;
      const shouldShow = await AsyncStorage.getItem('show_walkthrough');
      if (shouldShow === 'true') setShowWalkthrough(true);
    })();
  }, [user]);

  const dismissWalkthrough = () => {
    setShowWalkthrough(false);
    AsyncStorage.setItem('walkthrough_completed', 'true').catch(() => {});
    AsyncStorage.removeItem('show_walkthrough').catch(() => {});
    router.replace('/(tabs)');
  };

  if (initializing) {
    return null;
  }

  if (!user) {
    return <Redirect href="/welcome" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: Palette.purple,
          tabBarInactiveTintColor: Palette.inkDisabled,
          tabBarStyle: styles.tabBar,
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
          name="journey"
          options={{
            title: 'Journey',
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={PathIcon} color={color} focused={focused} />,
            tabBarLabel: ({ color }) => <TabLabel label="Journey" color={color} />,
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
            title: 'Opportunities',
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={BriefcaseIcon} color={color} focused={focused} />,
            tabBarLabel: ({ color }) => <TabLabel label="Jobs" color={color} />,
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
      <FloatingAskArri />
      {showWalkthrough && <FirstTimeWalkthrough onDone={dismissWalkthrough} />}
    </View>
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
  tabLabel: {
    fontFamily: Type.headingSemiBold,
    fontSize: 12,
    marginTop: 3,
  },
});
