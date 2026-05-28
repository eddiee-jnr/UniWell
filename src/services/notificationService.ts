import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Helper: check if notifications are allowed by preferences stored in Supabase user metadata
const shouldSendNotification = async (type: 'daily' | 'exams' | 'weekly' | 'monthly' | 'nudges'): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return true; // fallback to true for guest mode or unsaved profiles
    const profile = session.user.user_metadata;
    
    switch (type) {
      case 'daily':
        return profile?.notification_pref_daily !== false;
      case 'exams':
        return profile?.notification_pref_exams !== false;
      case 'weekly':
        return profile?.notification_pref_weekly !== false;
      case 'monthly':
        return profile?.notification_pref_monthly !== false;
      case 'nudges':
        return profile?.notification_pref_nudges !== false;
      default:
        return true;
    }
  } catch (err) {
    console.error('Error checking notification preferences:', err);
    return true;
  }
};

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus === 'undetermined') {
    // Show friendly popup first
    await new Promise<void>((resolve) => {
      Alert.alert(
        'Enable Notifications',
        'UniWell would like to send you reminders about upcoming deadlines and wellness check-ins. You can turn these off anytime in settings.',
        [{ text: 'Continue', onPress: () => resolve() }]
      );
    });
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  } else if (existingStatus === 'denied') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return finalStatus === 'granted';
};

export const scheduleLocalNotification = async (
  title: string,
  body: string,
  trigger: any,
  data?: Record<string, any>
): Promise<string> => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: trigger instanceof Date ? { date: trigger } : trigger,
    });
    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return '';
  }
};

// scheduleDeadlineReminder(eventTitle, eventDate)
// Schedules 7 days before and 1 day before.
export const scheduleDeadlineReminder = async (eventTitle: string, eventDate: string): Promise<{ id7: string, id1: string }> => {
  const allowed = await shouldSendNotification('exams');
  if (!allowed) return { id7: '', id1: '' };

  const eventDateObj = new Date(eventDate + 'T09:00:00');
  const now = new Date();

  // 7 days before:
  const trigger7 = new Date(eventDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
  // 1 day before:
  const trigger1 = new Date(eventDateObj.getTime() - 1 * 24 * 60 * 60 * 1000);

  let id7 = '';
  let id1 = '';

  if (trigger7 > now) {
    id7 = await scheduleLocalNotification(
      eventTitle,
      `${eventTitle} is one week away. Start preparing now.`,
      trigger7,
      { type: 'deadline', eventTitle, eventDate }
    );
  }

  if (trigger1 > now) {
    id1 = await scheduleLocalNotification(
      eventTitle,
      `${eventTitle} is tomorrow. Make sure you are ready.`,
      trigger1,
      { type: 'deadline', eventTitle, eventDate }
    );
  }

  return { id7, id1 };
};

// scheduleWellnessCheckInReminder(timeStr)
// e.g. "20:00"
export const scheduleWellnessCheckInReminder = async (timeStr: string = '20:00'): Promise<string> => {
  const allowed = await shouldSendNotification('daily');
  if (!allowed) return '';

  const [hour, minute] = timeStr.split(':').map(Number);
  
  const trigger: any = {
    hour,
    minute,
    repeats: true,
  };

  return await scheduleLocalNotification(
    'Daily Check-in',
    'Time for your daily check-in. How are you feeling today?',
    trigger,
    { type: 'wellness_checkin' }
  );
};

// scheduleWeeklyReportAlert()
export const scheduleWeeklyReportAlert = async (): Promise<string> => {
  const allowed = await shouldSendNotification('weekly');
  if (!allowed) return '';

  const trigger = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return await scheduleLocalNotification(
    'Weekly Report',
    'Your Weekly Wellness Report is ready. See how your week looked.',
    trigger,
    { type: 'weekly_report' }
  );
};

// scheduleMonthlyReportAlert()
export const scheduleMonthlyReportAlert = async (): Promise<string> => {
  const allowed = await shouldSendNotification('monthly');
  if (!allowed) return '';

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 10, 0, 0);

  return await scheduleLocalNotification(
    'Monthly Report',
    `Your ${now.toLocaleDateString('en-US', { month: 'long' })} Wellness Report is ready.`,
    nextMonth,
    { type: 'monthly_report' }
  );
};

// scheduleExamCountdownNudge(eventTitle, eventDate)
export const scheduleExamCountdownNudge = async (eventTitle: string, eventDate: string): Promise<string> => {
  const allowed = await shouldSendNotification('nudges');
  if (!allowed) return '';

  const eventDateObj = new Date(eventDate + 'T09:00:00');
  const now = new Date();

  // Trigger 3 days before exam
  const trigger3 = new Date(eventDateObj.getTime() - 3 * 24 * 60 * 60 * 1000);

  if (trigger3 > now) {
    return await scheduleLocalNotification(
      'Exam Wellness Nudge',
      `${eventTitle} is in 3 days. Try a breathing exercise to stay calm and focused.`,
      trigger3,
      { type: 'exam_nudge' }
    );
  }
  return '';
};

// scheduleCustomReminder(title, dateStr, triggerOption)
// triggerOption: 'none' | '1h' | '2h' | '1d' | '2d' | '7d'
export const scheduleCustomReminder = async (
  title: string,
  dateStr: string,
  triggerOption: 'none' | '1h' | '2h' | '1d' | '2d' | '7d'
): Promise<string> => {
  if (triggerOption === 'none') return '';
  
  const eventDateObj = new Date(dateStr + 'T09:00:00');
  const now = new Date();
  let triggerTime: Date;

  switch (triggerOption) {
    case '1h':
      triggerTime = new Date(eventDateObj.getTime() - 1 * 60 * 60 * 1000);
      break;
    case '2h':
      triggerTime = new Date(eventDateObj.getTime() - 2 * 60 * 60 * 1000);
      break;
    case '1d':
      triggerTime = new Date(eventDateObj.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '2d':
      triggerTime = new Date(eventDateObj.getTime() - 2 * 24 * 60 * 60 * 1000);
      break;
    case '7d':
      triggerTime = new Date(eventDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      return '';
  }

  if (triggerTime > now) {
    return await scheduleLocalNotification(
      title,
      `Reminder: ${title}`,
      triggerTime,
      { type: 'deadline', eventTitle: title, eventDate: dateStr }
    );
  }
  return '';
};

// cancelAllNotifications()
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// cancelNotificationById(id)
export const cancelNotificationById = async (id: string): Promise<void> => {
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
};

// Backward Compatibility Aliases for App.tsx
export const registerForPushNotificationsAsync = requestPermissions;
export const scheduleWellnessReminder = async (title: string, body: string, seconds: number) => {
  return await scheduleLocalNotification(title, body, { seconds } as Notifications.NotificationTriggerInput);
};
