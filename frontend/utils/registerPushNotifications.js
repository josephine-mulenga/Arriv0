import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { savePushToken } from '@/api';

// Never let a push-registration failure surface as an uncaught rejection —
// this runs silently in the background on every tab-bar mount, and it's
// also awaited directly from the "Enable Notifications" button, so any
// throw here would otherwise crash that tap with a red error screen.
export const registerForPushNotifications = async (userId, token) => {
  try {
    if (Platform.OS === 'web') {
      console.log('Push notifications are not supported on web.');
      return;
    }

    const Notifications = await import('expo-notifications');

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device.');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted.');
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      // No EAS project configured — this is expected in Expo Go / before
      // `eas init`. Push notifications need a development build to work at
      // all (Expo Go dropped support for this on Android in SDK 53), so
      // this just quietly no-ops instead of throwing.
      console.log('Push notifications skipped: no EAS projectId configured.');
      return;
    }

    const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = pushTokenData.data;

    console.log('Expo push token:', pushToken);

    await savePushToken(userId, pushToken, token);
    console.log('Push token saved to backend.');
  } catch (err) {
    console.log('Push notification registration skipped:', err?.message ?? err);
  }
};