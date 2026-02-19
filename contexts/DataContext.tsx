import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { DailyLog, CycleSettings, CyclePhase, AppNotification } from '../types';
import { calculateCyclePhase } from '../lib/cycleUtils';

interface DataContextType {
  logs: DailyLog[];
  cycleSettings: CycleSettings;
  loading: boolean;
  error: Error | null; // Added error state
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  addLog: (log: DailyLog) => Promise<void>;
  getLog: (date: string) => DailyLog | undefined;
  updateSettings: (settings: Partial<CycleSettings>) => Promise<void>;
  getCyclePhase: (date?: string) => CyclePhase;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SETTINGS: CycleSettings = {
  avgCycleLength: 28,
  avgPeriodLength: 5,
  lastPeriodStart: '', 
  onboardingCompleted: false,
  irregularCycle: false
};

// Cache onboardingCompleted in localStorage to survive HMR / re-mounts
const getCachedOnboarding = (): boolean => {
  try { return localStorage.getItem('tw_onboarding_done') === 'true'; } catch { return false; }
};
const setCachedOnboarding = (v: boolean) => {
  try { localStorage.setItem('tw_onboarding_done', String(v)); } catch {}
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, sessionVerified } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [cycleSettings, setCycleSettings] = useState<CycleSettings>(() => {
    // Use cached onboarding flag to prevent HMR redirect flicker
    const cached = getCachedOnboarding();
    return cached ? { ...DEFAULT_SETTINGS, onboardingCompleted: true } : DEFAULT_SETTINGS;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load Data from Supabase
  // CRITICAL: Wait for sessionVerified before fetching.
  // Without this gate, the cached user triggers a fetch BEFORE the Supabase
  // client has a valid JWT, so RLS blocks the query and onboardingCompleted=false,
  // causing a redirect to /onboarding even though settings exist in the DB.
  useEffect(() => {
    console.log('[DATA DEBUG] useEffect triggered. user:', user?.id, 'role:', user?.role, 'authLoading:', authLoading, 'sessionVerified:', sessionVerified);
    
    // Don't fetch until supabase session JWT is actually verified
    if (!sessionVerified) return;
    
    if (!user) {
        console.log('[DATA DEBUG] No user, setting loading=false');
        setLogs([]);
        setCycleSettings(DEFAULT_SETTINGS);
        setCachedOnboarding(false);
        setLoading(false);
        return;
    }

    // Admin users don't need cycle data - skip fetching and set loading false
    if (user.role === 'admin') {
        console.log('[DATA DEBUG] ADMIN USER DETECTED - bypassing data fetch, setting loading=false');
        setLogs([]);
        setCycleSettings({ ...DEFAULT_SETTINGS, onboardingCompleted: true }); // Admins bypass onboarding
        setLoading(false);
        return;
    }

    // Partner/supporter users don't track periods - bypass onboarding
    // Check both role AND user_metadata.is_partner for robustness
    if (user.role === 'partner' || user.user_metadata?.is_partner === true) {
        console.log('[DATA DEBUG] PARTNER USER - bypassing data fetch, setting loading=false');
        setLogs([]);
        setCycleSettings({ ...DEFAULT_SETTINGS, onboardingCompleted: true });
        setLoading(false);
        return;
    }

    const fetchData = async () => {
      // Only skip re-fetch if we already have REAL settings loaded from Supabase
      // AND we have logs. This ensures a full data re-sync if the context resets.
      if (cycleSettings.onboardingCompleted && cycleSettings.lastPeriodStart && logs.length > 0) {
        console.log('[DATA DEBUG] Data already fully loaded, skipping re-fetch');
        setLoading(false);
        return;
      }

      // Only set loading true if we don't have settings yet (initial load)
      // This prevents UI blocking on background re-auth/refreshes
      if (cycleSettings === DEFAULT_SETTINGS) {
          setLoading(true);
      }
      
      try {
        // 1. Fetch Logs
        const { data: logsData, error: logsError } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id);

        if (logsError) throw logsError;
        if (logsData) {
             setLogs(logsData as unknown as DailyLog[]);
        }

        // 2. Fetch Settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

          if (!settingsError && settingsData) {
            const s = settingsData as any;
            
            // SMART FALLBACK: If last_period_start is NULL in DB, try to find the most recent log with flow
            let effectiveStart = s.last_period_start || '';
            if (!effectiveStart && logsData && logsData.length > 0) {
                // Find most recent log with flow
                const sortedLogs = [...(logsData as any[])].sort((a, b) => b.date.localeCompare(a.date));
                const latestFlowLog = sortedLogs.find(l => l.flow);
                if (latestFlowLog) {
                    console.log('[DATA DEBUG] Using fallback lastPeriodStart from log:', latestFlowLog.date);
                    effectiveStart = latestFlowLog.date;
                }
            }

            setCycleSettings({
                avgCycleLength: s.avg_cycle_length || 28,
                avgPeriodLength: s.avg_period_length || 5,
                lastPeriodStart: effectiveStart, 
                onboardingCompleted: s.onboarding_completed || false,
                irregularCycle: s.irregular_cycle || false
            });
            setCachedOnboarding(!!s.onboarding_completed);
         } else if (settingsError && settingsError.code === 'PGRST116') {
            // ONLY reset if confirmed "Row not found" (New user)
            // PGRST116 is the Postgrest error code for 0 rows from .single()
            console.log('[DATA DEBUG] No settings found for user (PGRST116), using defaults');
            setCycleSettings({ ...DEFAULT_SETTINGS, onboardingCompleted: false });
         } else if (settingsError) {
             console.error('[DATA DEBUG] Error fetching settings (not resetting defaults):', settingsError);
             // Do NOT reset settings on transient errors
             setError(new Error(`Failed to load settings: ${settingsError.message}`));
         }

        // 3. Fetch Notifications from database
        const { data: notifData, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!notifError && notifData) {
          setNotifications(notifData.map((n: any) => ({
            id: n.id,
            type: n.type,
            message: n.message,
            isRead: n.is_read,
            timestamp: n.created_at
          })));
        }

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any; // Cast to any to access DB row properties
          const mapped: AppNotification = {
            id: newNotif.id,
            type: newNotif.type,
            message: newNotif.message,
            isRead: false,
            timestamp: newNotif.created_at || new Date().toISOString()
          };
          
          setNotifications(prev => [mapped, ...prev]);

          // Show system notification if permission granted
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
             try {
                new Notification('Twilight Garden', { body: mapped.message, icon: '/twilight.png' });
             } catch (e) {
                console.warn('System notification failed:', e);
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [user?.id, user?.role, sessionVerified]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    
    // Persist to database ONLY if it's a real DB notification (UUID)
    // Local notifications start with 'reminder-' or 'period-'
    if (id.startsWith('reminder-') || id.startsWith('period-')) return;

    try {
      await supabase.from('notifications').update({ is_read: true } as any).eq('id', id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const addLog = async (newLog: DailyLog) => {
    if (!user) return;

    // Optimistic Update
    const existingIndex = logs.findIndex(l => l.date === newLog.date);
    let updatedLogs;
    if (existingIndex >= 0) {
      updatedLogs = [...logs];
      updatedLogs[existingIndex] = { ...updatedLogs[existingIndex], ...newLog };
    } else {
      updatedLogs = [...logs, newLog];
    }
    setLogs(updatedLogs);

    // Persist to Supabase
    try {
        const { error } = await supabase.from('daily_logs').upsert({
            user_id: user.id,
            date: newLog.date,
            flow: newLog.flow || null,
            moods: newLog.moods || [],
            symptoms: newLog.symptoms || [],
            notes: newLog.notes || null
        } as any, { onConflict: 'user_id,date' });

        if (error) throw error;

        // Trigger Notification if it's a new log for today
        // We check existingIndex to avoid spamming on edits, and ensuring it's for today/recent interaction
        if (existingIndex === -1) {
            // Find partner
            const { data: couple } = await supabase
                .from('couples')
                .select('partner_1_id, partner_2_id')
                .or(`partner_1_id.eq.${user.id},partner_2_id.eq.${user.id}`)
                .eq('status', 'active')
                .single();

            const coupleData = couple as any;

            if (coupleData) {
                const partnerId = coupleData.partner_1_id === user.id ? coupleData.partner_2_id : coupleData.partner_1_id;
                
                if (partnerId) {
                    // Get nickname preference of the PARTNER (what they call me)
                    const { data: partnerProfile } = await supabase
                        .from('profiles')
                        .select('partner_nickname')
                        .eq('id', partnerId)
                        .single();

                    const nickname = (partnerProfile as any)?.partner_nickname || 'partner';
                    const message = `Your ${nickname} has completed their daily log.`;

                    // Insert Notification
                    await supabase.from('notifications').insert({
                        user_id: partnerId,
                        type: 'log',
                        message: message,
                        created_at: new Date().toISOString(),
                        is_read: false
                    } as any);
                }
            }
        }
    } catch (err) {
        console.error("Failed to save log:", err);
    }
  };

  const getLog = (date: string) => logs.find(l => l.date === date);

  const updateSettings = async (updates: Partial<CycleSettings>) => {
    const newSettings = { ...cycleSettings, ...updates };
    setCycleSettings(newSettings);

    if (user) {
        try {
            const { error } = await supabase.from('user_settings').upsert({
                user_id: user.id,
                avg_cycle_length: newSettings.avgCycleLength,
                avg_period_length: newSettings.avgPeriodLength,
                last_period_start: newSettings.lastPeriodStart || null,
                onboarding_completed: newSettings.onboardingCompleted,
                irregular_cycle: newSettings.irregularCycle
            } as any);
            if (error) throw error;
        } catch (err) {
            console.error("Failed to save settings:", err);
        }
    }
  };



  const getCyclePhase = (dateStr: string = new Date().toISOString().split('T')[0]): CyclePhase => {
    return calculateCyclePhase(dateStr, cycleSettings);
  };

  // Check for Notifications (Run once on load or when data changes)
  useEffect(() => {
    if (loading || !cycleSettings.lastPeriodStart) return;

    const newNotifications: AppNotification[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Reminder: check if logged today (only if it's evening, e.g., > 6PM)
    const hasLoggedToday = logs.some(l => l.date === todayStr);
    const hour = new Date().getHours();
    
    if (!hasLoggedToday && hour >= 18) {
        newNotifications.push({
            id: 'reminder-' + todayStr,
            type: 'reminder',
            message: 'How are you feeling today? Tap to log.',
            isRead: false,
            timestamp: new Date().toISOString()
        });
    }

    // 2. Period Prediction
    const phase = getCyclePhase(todayStr);
    if (phase.nextPeriodIn <= 3 && phase.nextPeriodIn > 0) {
        const msg = `Your period is likely to start in ${phase.nextPeriodIn} days.`;
        newNotifications.push({
            id: 'period-soon-' + todayStr,
            type: 'period_start',
            message: msg,
            isRead: false,
            timestamp: new Date().toISOString()
        });
        
        // System Notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
             try {
                new Notification('Cycle Alert', { body: msg, icon: '/icon.png' });
             } catch (e) {
                console.warn('Notification failed:', e);
             }
        }
    }

    // Only set if different to avoid loop
    setNotifications(prev => {
        const added = newNotifications.filter(n => !prev.some(p => p.id === n.id));
        
        // Trigger generic reminder notification check
        if (added.length > 0 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
             const reminder = added.find(n => n.type === 'reminder');
             if (reminder) {
                 try {
                    new Notification('Twilight Garden', { body: reminder.message });
                 } catch (e) {
                    console.warn('Notification failed:', e);
                 }
             }
        }

        return added.length ? [...prev, ...added] : prev;
    });


  }, [logs, cycleSettings, loading]);

  return (
    <DataContext.Provider value={{ logs, cycleSettings, loading, error, notifications, markAsRead, addLog, getLog, updateSettings, getCyclePhase }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
