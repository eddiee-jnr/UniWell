import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C6FEB',
    });
  }

  return true;
};

export const scheduleWellnessReminder = async (title: string, body: string, seconds: number = 60) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || "UniWell Sanctuary 🧘",
      body: body || "Time for a 5-minute 'Box Breathing' session to reset your focus.",
      data: { screen: 'Exercises' },
    },
    trigger: {
      seconds,
      channelId: Platform.OS === 'android' ? 'default' : undefined,
    } as Notifications.TimeIntervalTriggerInput,
  });
};
