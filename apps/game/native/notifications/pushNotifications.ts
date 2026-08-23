import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { devicesApi } from '@xalaat/core';
import { appStorage } from '~/lib/utils/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

const PUSH_TOKEN_STORAGE_KEY = 'xalaat_push_token';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice && Platform.OS !== 'web') {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E05624',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (token) {
      const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
      await devicesApi.registerDevice({ token, platform }).catch((err) => {
        console.warn('Failed to register push token with backend:', err);
      });
      await appStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    }

    return token;
  } catch (error) {
    console.warn('Error setting up push notifications:', error);
    return null;
  }
}

export async function unregisterPushNotificationsAsync(): Promise<void> {
  try {
    const storedToken = await appStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (storedToken) {
      await devicesApi.unregisterDevice(storedToken).catch(() => {});
      await appStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Error unregistering push notifications:', error);
  }
}
