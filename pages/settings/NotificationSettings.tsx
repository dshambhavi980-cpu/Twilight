import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [periodNotifications, setPeriodNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

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

  const togglePeriod = () => {
    const newValue = !periodNotifications;
    setPeriodNotifications(newValue);
    updateSetting('period_notifications', newValue);
  };

  const toggleReminder = () => {
    const newValue = !reminderNotifications;
    setReminderNotifications(newValue);
    updateSetting('reminder_notifications', newValue);
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
        
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-soft transition-colors">
          {/* Period Cycle Notifications */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-500 w-10 h-10">
                <span className="material-symbols-outlined">cycle</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-[#121014] dark:text-gray-200">Period Predictions</span>
                <span className="text-xs text-gray-500">Get notified before your period starts</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                className="sr-only peer" 
                type="checkbox" 
                checked={periodNotifications}
                onChange={togglePeriod}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
                <span className="text-xs text-gray-500">Reminders to log your symptoms</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                className="sr-only peer" 
                type="checkbox" 
                checked={reminderNotifications}
                onChange={toggleReminder}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Test Notification */}
      <div className="px-6">
        <button 
          className="w-full py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          onClick={() => new Notification("Twilight Garden", { body: "Notifications are working! 🌸" })}
        >
          <span className="material-symbols-outlined text-sm">send</span>
          Send Test Notification
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
