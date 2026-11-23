import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Preferences } from '../domain/backup';

const KIND = 'dreamfund-reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function syncReminder(preferences: Preferences): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier === KIND || item.content.data?.kind === KIND)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
  if (!preferences.reminderEnabled) return;
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Notifications are turned off for Dream Fund.');
  await Notifications.scheduleNotificationAsync({
    identifier: KIND,
    content: {
      title: 'Dream Fund',
      body: 'Set aside something for your goals today.',
      data: { kind: KIND },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: preferences.reminderHour,
      minute: preferences.reminderMinute,
    },
  });
}
