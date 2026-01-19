import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

// Check if running in Capacitor (mobile)
const isCapacitor = () => {
  return window.location.href.includes('localhost') && 
         (navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone'));
};

// Request notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isCapacitor()) {
    // Fallback to web notifications
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return false;
  }

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// Check if notifications are enabled
export async function checkNotificationPermission(): Promise<boolean> {
  if (!isCapacitor()) {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
}

// Default reminder times (can be customized)
const DAILY_REMINDER_TIMES = [
  { id: 10, hour: 9, minute: 0, title: '🌅 Good Morning!', body: 'Start your day by logging how you feel.' },
  { id: 11, hour: 10, minute: 0, title: '✨ Gentle Reminder', body: 'Have you tracked your symptoms yet?' },
  { id: 12, hour: 12, minute: 0, title: '☀️ Midday Check-in', body: 'Take a moment to update your log.' },
  { id: 13, hour: 15, minute: 0, title: '🍵 Afternoon Check', body: 'How are you feeling this afternoon?' },
  { id: 14, hour: 18, minute: 0, title: '� Evening Reflection', body: 'Evening check-in time.' },
  { id: 15, hour: 23, minute: 0, title: '🌙 Good Night', body: 'Don\'t forget to log your day before sleep.' },
];

// Schedule daily reminder notifications at multiple times
export async function scheduleDailyReminders(): Promise<void> {
  if (!isCapacitor()) {
    console.log('Local notifications only work on mobile devices');
    return;
  }

  try {
    // Cancel existing daily reminders first
    await LocalNotifications.cancel({ 
      notifications: DAILY_REMINDER_TIMES.map(r => ({ id: r.id })) 
    });

    // Schedule reminders at all times
    const notifications = DAILY_REMINDER_TIMES.map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      schedule: {
        on: {
          hour: reminder.hour,
          minute: reminder.minute,
        },
        repeats: true,
        allowWhileIdle: true,
      },
      sound: 'default',
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
    }));

    await LocalNotifications.schedule({ notifications });
    console.log('Daily reminders scheduled for 9am, 10am, 12pm, 3pm, 6pm, 11pm');
  } catch (error) {
    console.error('Error scheduling daily reminders:', error);
  }
}

// Legacy function for backwards compatibility (schedules all 3 reminders)
export async function scheduleDailyReminder(hour: number = 20, minute: number = 0): Promise<void> {
  // Now schedules all 3 daily reminders
  await scheduleDailyReminders();
}

// Schedule period prediction notification
export async function schedulePeriodReminder(daysUntilPeriod: number): Promise<void> {
  if (!isCapacitor() || daysUntilPeriod < 1) {
    return;
  }

  try {
    // Cancel existing period reminders
    await LocalNotifications.cancel({ notifications: [{ id: 2, }, { id: 3 }] });

    const notifications: ScheduleOptions['notifications'] = [];

    // Notify 3 days before period
    if (daysUntilPeriod >= 3) {
      const threeDaysBefore = new Date();
      threeDaysBefore.setDate(threeDaysBefore.getDate() + (daysUntilPeriod - 3));
      threeDaysBefore.setHours(9, 0, 0, 0);

      notifications.push({
        id: 2,
        title: '🌙 Period Coming Soon',
        body: 'Your period is expected in about 3 days. Stay prepared!',
        schedule: { at: threeDaysBefore },
        sound: 'default',
        smallIcon: 'ic_launcher',
        largeIcon: 'ic_launcher',
      });
    }

    // Notify 1 day before period
    if (daysUntilPeriod >= 1) {
      const oneDayBefore = new Date();
      oneDayBefore.setDate(oneDayBefore.getDate() + (daysUntilPeriod - 1));
      oneDayBefore.setHours(9, 0, 0, 0);

      notifications.push({
        id: 3,
        title: '🌺 Period Expected Tomorrow',
        body: 'Your period is likely to start tomorrow. Take care!',
        schedule: { at: oneDayBefore },
        sound: 'default',
        smallIcon: 'ic_launcher',
        largeIcon: 'ic_launcher',
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log('Period reminders scheduled');
    }
  } catch (error) {
    console.error('Error scheduling period reminder:', error);
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  if (!isCapacitor()) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

// Get pending notifications
export async function getPendingNotifications(): Promise<number> {
  if (!isCapacitor()) return 0;

  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications.length;
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return 0;
  }
}

// Initialize notification listeners
export function initNotificationListeners(): void {
  if (!isCapacitor()) return;

  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
  });

  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    console.log('Notification action performed:', action);
    // Navigate to appropriate page based on notification
    if (action.notification.id === 1) {
      // Daily reminder - go to log page
      window.location.hash = '#/log/details';
    }
  });
}
