import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Preferences } from "../domain/backup";
import { REMINDER_KIND } from "../constants";
import { t } from "../locale/messages";

const KIND = REMINDER_KIND;

if (Platform.OS !== "web") {
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
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (item) => item.identifier === KIND || item.content.data?.kind === KIND,
      )
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier),
      ),
  );
  if (!preferences.reminderEnabled) return;
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error(t("reminder.denied"));
  await Notifications.scheduleNotificationAsync({
    identifier: KIND,
    content: {
      title: t("reminder.title"),
      body: t("reminder.body"),
      data: { kind: KIND },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: preferences.reminderHour,
      minute: preferences.reminderMinute,
    },
  });
}
