import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';
import {
  requestNotificationPermission,
  checkNotificationPermission,
  scheduleDailyReminder,
  schedulePeriodReminder,
  cancelAllNotifications,
  initNotificationListeners
} from '../../lib/notifications';

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCyclePhase } = useData();
  
  const [periodNotifications, setPeriodNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initNotificationListeners();
    checkPermission();
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const checkPermission = async () => {
    const granted = await checkNotificationPermission();
    setPermissionGranted(granted);
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('period_notifications, reminder_notifications')
        .eq('user_id', user?.id)
        .single();
      
      if (data) {
        setPeriodNotifications(data.period_notifications ?? true);
        setReminderNotifications(data.reminder_notifications ?? true);
        
        // Schedule notifications based on saved settings
        if (data.reminder_notifications) {
          await scheduleDailyReminder(20, 0); // 8 PM
        }
        if (data.period_notifications) {
          const cycleData = getCyclePhase();
          await schedulePeriodReminder(cycleData.nextPeriodIn);
        }
      }
    } catch (error) {
      console.error("Error fetching notification settings", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (field: string, value: boolean) => {
    try {
      await supabase
        .from('user_settings')
        .update({ [field]: value } as any)
        .eq('user_id', user?.id);
    } catch (error) {
      console.error("Error updating notification settings", error);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (granted) {
      // Schedule notifications after permission granted
      if (reminderNotifications) {
        await scheduleDailyReminder(20, 0);
      }
      if (periodNotifications) {
        const cycleData = getCyclePhase();
        await schedulePeriodReminder(cycleData.nextPeriodIn);
      }
    }
  };

  const togglePeriod = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const newValue = !periodNotifications;
      setPeriodNotifications(newValue);
      await updateSetting('period_notifications', newValue);
      
      if (newValue && permissionGranted) {
        const cycleData = getCyclePhase();
        await schedulePeriodReminder(cycleData.nextPeriodIn);
      } else {
        await cancelAllNotifications();
        if (reminderNotifications) {
          await scheduleDailyReminder(20, 0);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleReminder = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const newValue = !reminderNotifications;
      setReminderNotifications(newValue);
      await updateSetting('reminder_notifications', newValue);
      
      if (newValue && permissionGranted) {
        await scheduleDailyReminder(20, 0);
      } else {
        await cancelAllNotifications();
        if (periodNotifications) {
          const cycleData = getCyclePhase();
          await schedulePeriodReminder(cycleData.nextPeriodIn);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestNotification = async () => {
    if (!permissionGranted) {
      await handleRequestPermission();
      return;
    }

    // Use LocalNotifications API for test
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: 999,
          title: '🌸 Twilight Garden',
          body: 'Notifications are working! You\'ll receive reminders at 8 PM daily.',
          schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
          sound: 'default',
          smallIcon: 'ic_launcher',
        }]
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Could not send test notification. Please check app permissions.');
    }
  };

  return (
    <div className="animate-slideIn font-display flex flex-col pb-24 bg-[#FDFCF8] dark:bg-background-dark min-h-screen transition-colors duration-300">
      <header className="flex items-center px-6 pt-8 pb-4 gap-4 bg-transparent">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-white/5"
        >
          <span className="material-symbols-outlined text-[#121014] dark:text-white text-xl">arrow_back</span>
        </button>
        <h2 className="text-[#121014] dark:text-white text-2xl font-bold leading-tight tracking-tight">Notifications</h2>
      </header>

      <div className="px-6 mb-8">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Choose which notifications you'd like to receive. We'll send you gentle reminders to help you track your cycle.
        </p>
        
        {/* Permission Status */}
        {!permissionGranted && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-amber-500">notifications_off</span>
              <span className="font-medium text-amber-700 dark:text-amber-400">Notifications Disabled</span>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-300 mb-3">
              Enable notifications to receive period predictions and daily reminders.
            </p>
            <button
              onClick={handleRequestPermission}
              className="w-full py-2 rounded-lg bg-amber-500 text-white font-semibold text-sm"
            >
              Enable Notifications
            </button>
          </div>
        )}

        {permissionGranted && (
          <div className="mb-6 p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            <span className="text-sm text-green-700 dark:text-green-400">Notifications enabled</span>
          </div>
        )}
        
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-soft transition-colors">
          {/* Period Cycle Notifications */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-500 w-10 h-10">
                <span className="material-symbols-outlined">cycle</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-[#121014] dark:text-gray-200">Period Predictions</span>
                <span className="text-xs text-gray-500">Get notified 3 days & 1 day before</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                className="sr-only peer" 
                type="checkbox" 
                checked={periodNotifications}
                onChange={togglePeriod}
                disabled={loading || !permissionGranted}
              />
              <div className={`w-11 h-6 ${permissionGranted ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-300 dark:bg-gray-800'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary`}></div>
            </label>
          </div>

          {/* Daily Reminder Notifications */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 w-10 h-10">
                <span className="material-symbols-outlined">edit_note</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-[#121014] dark:text-gray-200">Daily Reminders</span>
                <span className="text-xs text-gray-500">Alerts at 9AM, 10AM, 12PM, 3PM, 6PM & 11PM</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                className="sr-only peer" 
                type="checkbox" 
                checked={reminderNotifications}
                onChange={toggleReminder}
                disabled={loading || !permissionGranted}
              />
              <div className={`w-11 h-6 ${permissionGranted ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-300 dark:bg-gray-800'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary`}></div>
            </label>
          </div>
        </div>
      </div>

      {/* Test Notification */}
      <div className="px-6">
        <button 
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
            testSent 
              ? 'bg-green-500 text-white' 
              : 'bg-primary/10 hover:bg-primary/20 text-primary'
          }`}
          onClick={sendTestNotification}
          disabled={testSent}
        >
          <span className="material-symbols-outlined text-sm">
            {testSent ? 'check' : 'send'}
          </span>
          {testSent ? 'Notification Sent!' : 'Send Test Notification'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">
          You'll receive a test notification in 1 second
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;
