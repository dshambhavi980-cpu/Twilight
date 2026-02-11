import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { exportHealthDataToPDF, exportDoctorsReport } from '../lib/exportPDF';
import TodayReportModal from '../components/TodayReportModal';
import Toast from '../components/Toast';

const Settings: React.FC = () => {
  const { signOut, user } = useAuth();
  const { theme, toggleTheme, primaryColor } = useTheme();
  const { cycleSettings, updateSettings, logs } = useData();
  const navigate = useNavigate();


  
  // Initialize from cache for instant load
  const [profile, setProfile] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('twilight_profile');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  
  const [showTodayReport, setShowTodayReport] = useState(false);
  const [toast, setToast] = useState<{ message: string; subMessage?: string; type: 'success' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });
  
  // Get today's log
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === todayStr) || null;

  useEffect(() => {
    if (user) {
        fetchProfile();
    }
  }, [user]);


  const fetchProfile = async () => {
      try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single();
          
          if (data) {
              setProfile(data);
              localStorage.setItem('twilight_profile', JSON.stringify(data));
          }
      } catch (error) {
          console.error("Error fetching profile", error);
      }
  };

  const handleLogout = () => {
    signOut();
    localStorage.removeItem('twilight_profile'); // Clear cache on logout
    navigate('/welcome');
  };

  const showToast = (message: string, subMessage?: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, subMessage, type, isVisible: true });
  };

  const handleExportPDF = async () => {
    try {
      await exportHealthDataToPDF({
        profile: {
          full_name: profile?.full_name || 'User',
          email: profile?.email || user?.email || '',
        },
        cycleSettings,
        logs,
      });
      // Success feedback is handled inside exportHealthDataToPDF for now, but ideally should return success
      // For now, we assume if no error, it triggered the save. 
      // Note: exportHealthDataToPDF uses window.alert currently. We should update that too.
      // Ideally pass a callback or refactor to return status. 
      // For this step, we'll let the user know process started.
      showToast('Export Started', 'Generating your health report...');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      showToast('Export Failed', 'Please try again', 'error');
    }
  };

  const handleDoctorsReport = async () => {
    try {
      await exportDoctorsReport({
        profile: {
          full_name: profile?.full_name || 'User',
          email: profile?.email || user?.email || '',
        },
        cycleSettings,
        logs,
      });
      showToast('Report Generated', 'Doctor\'s report is ready');
    } catch (error) {
      console.error('Failed to generate doctor report:', error);
      showToast('Generation Failed', 'Please try again', 'error');
    }
  };

  return (
    <div className="animate-slideIn font-display flex flex-col pb-24 bg-[#FDFCF8] dark:bg-background-dark min-h-screen transition-colors duration-300">
      {/* Global Toast */}
      <Toast 
        message={toast.message}
        subMessage={toast.subMessage}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      <header className="flex items-center px-6 pt-8 pb-4 bg-transparent">
        <h2 className="text-[#121014] dark:text-white text-2xl font-bold leading-tight tracking-tight">Settings</h2>
      </header>

      <div className="px-6 mb-8">
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-soft border border-gray-100 dark:border-white/5 flex flex-col items-center gap-4 transition-colors">
          <div className="relative group cursor-pointer" onClick={() => navigate('/settings/profile')}>
            <div
              className="h-24 w-24 rounded-full bg-cover bg-center border-4 border-white dark:border-[#1E1B24] shadow-md transition-transform group-hover:scale-[1.02]"
              style={{
                backgroundImage:
                  `url("${profile?.avatar_url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}")`,
              }}
            ></div>
            <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full border-2 border-white dark:border-[#1E1B24] flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-[#121014] dark:text-white">{profile?.full_name || 'User'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
          <button 
            onClick={() => navigate('/settings/profile')}
            className="w-full py-2.5 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-colors"
          >
            Edit Profile Details
          </button>
        </div>
      </div>

      <div className="px-6 mb-8">
        <h3 className="text-[#121014] dark:text-white text-lg font-bold mb-3 px-1">App Preferences</h3>
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-soft transition-colors mb-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group" onClick={toggleTheme}>
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 ${theme === 'dark' ? 'text-purple-300' : 'text-orange-500'} w-10 h-10 group-hover:scale-105 transition-transform`}>
                <span className="material-symbols-outlined">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-[#121014] dark:text-gray-200">Dark Mode</span>
                <span className="text-xs text-gray-500">{theme === 'dark' ? 'On' : 'Off'}</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
              <input className="sr-only peer" type="checkbox" checked={theme === 'dark'} readOnly />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Color Theme Customization Link */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 p-1 shadow-soft transition-colors mt-4">
            <div 
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer rounded-xl group"
                onClick={() => navigate('/settings/theme')}
            >
                <div className="flex items-center gap-3">
                    <div 
                        className="w-10 h-10 rounded-xl shadow-sm border border-black/5 dark:border-white/10 flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ backgroundColor: primaryColor }}
                    >
                         <span className="material-symbols-outlined text-white text-lg drop-shadow-md">palette</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-[#121014] dark:text-gray-200">App Theme Color</span>
                        <span className="text-xs text-gray-500">Customize appearance</span>
                    </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 text-sm">arrow_forward_ios</span>
            </div>
        </div>
      </div>

      <div className="px-6 mb-8">
        <h3 className="text-[#121014] dark:text-white text-lg font-bold mb-3 px-1">App Settings</h3>
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-soft transition-colors">
            <div 
                className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => navigate('/notes')}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/20 text-pink-500 w-10 h-10 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-filled">favorite</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-[#121014] dark:text-gray-200">Love Lock</span>
                        <span className="text-xs text-gray-500">Couples Space</span>
                    </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 text-sm">arrow_forward_ios</span>
            </div>
            <div 
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => navigate('/settings/notifications')}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-pink-500 w-10 h-10 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined">notifications</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-[#121014] dark:text-gray-200">Manage Notifications</span>
                        <span className="text-xs text-gray-500">Period alerts & daily reminders</span>
                    </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 text-sm">arrow_forward_ios</span>
            </div>
        </div>
      </div>

      <div className="px-6 mb-8">
        <h3 className="text-[#121014] dark:text-white text-lg font-bold mb-3 px-1">Cycle Preferences</h3>
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-soft transition-colors">
          {[
            { icon: 'cached', label: 'Cycle Length', value: `${cycleSettings.avgCycleLength} days`, color: 'text-primary', link: '/settings/cycle-length' },
            { icon: 'water_drop', label: 'Period Length', value: `${cycleSettings.avgPeriodLength} days`, color: 'text-purple-400', link: '/settings/period-length' },
          ].map((item, i) => (
            <div 
                key={i} 
                className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => navigate(item.link)}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 ${item.color} w-10 h-10 group-hover:scale-105 transition-transform`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <span className="font-medium text-[#121014] dark:text-gray-200">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#121014] dark:text-white font-semibold">{item.value}</span>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 text-sm">arrow_forward_ios</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-amber-500 dark:text-amber-300 w-10 h-10">
                <span className="material-symbols-outlined">waves</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-[#121014] dark:text-gray-200">Irregular Cycle</span>
                <span className="text-xs text-gray-500">Don't predict future dates</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                className="sr-only peer" 
                type="checkbox" 
                checked={cycleSettings.irregularCycle}
                onChange={() => updateSettings({ irregularCycle: !cycleSettings.irregularCycle })}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="px-6 mb-8">
        <h3 className="text-[#121014] dark:text-white text-lg font-bold mb-3 px-1">My Data</h3>
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-soft transition-colors">
            <div 
                className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => navigate('/settings/history')}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-pink-500 w-10 h-10 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <span className="font-medium text-[#121014] dark:text-gray-200">Log History</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 text-sm">arrow_forward_ios</span>
            </div>
        </div>
      </div>

      <div className="px-6 mb-8">
        <h3 className="text-[#121014] dark:text-white text-lg font-bold mb-3 px-1">Support & Data</h3>
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col shadow-soft transition-colors">
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-primary w-10 h-10">
                <span className="material-symbols-outlined">download</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-[#121014] dark:text-gray-200">Export Health Data</span>
                <span className="text-xs text-gray-500">Download PDF report</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-600">chevron_right</span>
          </button>
          <button 
            onClick={handleDoctorsReport}
            className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 w-10 h-10">
                <span className="material-symbols-outlined">medical_information</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-[#121014] dark:text-gray-200">Generate Doctor's Report</span>
                <span className="text-xs text-gray-500">Medical summary for healthcare providers</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-600">chevron_right</span>
          </button>
          <button 
            onClick={() => setShowTodayReport(true)}
            className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 w-10 h-10">
                <span className="material-symbols-outlined">today</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-[#121014] dark:text-gray-200">Today's Report Card</span>
                <span className="text-xs text-gray-500">Download today's symptoms as PNG/PDF</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-600">chevron_right</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            <div className="flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 w-10 h-10">
              <span className="material-symbols-outlined">logout</span>
            </div>
            <span className="font-medium text-red-500 dark:text-red-400">Log Out</span>
          </button>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-600">Version 2.4.0</p>
        </div>
      </div>
      
      {/* Today's Report Modal */}
      <TodayReportModal
        isOpen={showTodayReport}
        onClose={() => setShowTodayReport(false)}
        todayLog={todayLog}
        cycleSettings={cycleSettings}
        profile={profile || {}}
      />
    </div>
  );
};

export default Settings;