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

const WALKTHROUGH_SHOWN_KEY = 'arriv0_walkthrough_shown';

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

  // First-time walkthrough: shown once, the first time this tab layout ever
  // mounts for a logged-in user (i.e. right after signup completes the
  // onboarding flow) - the AsyncStorage flag makes it permanent, so it never
  // reappears on later logins even after the app is fully closed.
  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(WALKTHROUGH_SHOWN_KEY).then((shown) => {
      if (!shown) setShowWalkthrough(true);
    });
  }, [user]);

  const dismissWalkthrough = () => {
    setShowWalkthrough(false);
    AsyncStorage.setItem(WALKTHROUGH_SHOWN_KEY, 'true').catch(() => {});
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
            tabBarLabel: ({ color }) => <TabLabel label="Opportunities" color={color} />,
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
    fontSize: 10.5,
    marginTop: 3,
  },
});
