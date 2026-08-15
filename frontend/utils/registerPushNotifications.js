import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { savePushToken } from '@/api';

export const registerForPushNotifications = async (userId, token) => {
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

  const pushTokenData = await Notifications.getExpoPushTokenAsync();
  const pushToken = pushTokenData.data;

  console.log('Expo push token:', pushToken);

  try {
    await savePushToken(userId, pushToken, token);
    console.log('Push token saved to backend.');
  } catch (err) {
    console.log('Failed to save push token:', err.message);
  }
};