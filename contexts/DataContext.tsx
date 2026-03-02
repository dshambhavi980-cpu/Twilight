import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCouples } from './CouplesContext';
import { DailyLog, CycleSettings, CyclePhase, AppNotification } from '../types';
import { calculateCyclePhase } from '../lib/cycleUtils';
import { encryptData, decryptData } from '../lib/encryption';

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

// Sync helper to get user ID before first render
const getSyncUserId = (): string | null => {
  try {
    const cached = localStorage.getItem('twilight-cached-user');
    if (cached) {
      const userData = JSON.parse(cached);
      return userData?.id || null;
    }
  } catch { return null; }
  return null;
};

// Cache helpers scoped by UserId
const getCachedSettings = (userId: string | null): CycleSettings => {
  if (!userId) return DEFAULT_SETTINGS;
  try {
    const cached = localStorage.getItem(`tw_settings_${userId}`);
    if (cached) return JSON.parse(cached);
  } catch { return DEFAULT_SETTINGS; }
  // Only fallback to legacy flag if no full settings exist
  try { 
      const done = localStorage.getItem('tw_onboarding_done') === 'true'; 
      return done ? { ...DEFAULT_SETTINGS, onboardingCompleted: true } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
};

const getCachedLogs = (userId: string | null): DailyLog[] => {
  if (!userId) return [];
  try {
    const cached = localStorage.getItem(`tw_logs_${userId}`);
    if (cached) return JSON.parse(cached);
  } catch { return []; }
  return [];
};

const setCachedSettings = (userId: string | null, settings: CycleSettings) => {
  if (!userId) return;
  try { localStorage.setItem(`tw_settings_${userId}`, JSON.stringify(settings)); } catch { }
};

const setCachedLogs = (userId: string | null, logs: DailyLog[]) => {
  if (!userId) return;
  // Keep cache small (e.g. only last 90 days) if needed, but for now cache all since logs might be small
  try { localStorage.setItem(`tw_logs_${userId}`, JSON.stringify(logs)); } catch { }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, sessionVerified } = useAuth();
  const { broadcastUpdate, partnerPubKey } = useCouples();
  
  // Synchronous cache load prevents initial Dashboard "Day 1" flash
  const syncUserId = getSyncUserId();
  const [logs, setLogs] = useState<DailyLog[]>(() => {
    const userId = getSyncUserId();
    return getCachedLogs(userId);
  });
  const [cycleSettings, setCycleSettings] = useState<CycleSettings>(() => {
    const userId = getSyncUserId();
    return getCachedSettings(userId);
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Start loading=false if we already have valid cached data — renders dashboard instantly
  const [loading, setLoading] = useState(() => {
    const userId = getSyncUserId();
    const cached = getCachedSettings(userId);
    // If onboarding is completed AND we have a lastPeriodStart, cache is valid — skip loading
    return !(cached.onboardingCompleted && cached.lastPeriodStart);
  });
  const [error, setError] = useState<Error | null>(null);

    const mapLog = async (l: any): Promise<DailyLog> => {
      let data = { ...l };
      
      // Decrypt payload if it exists
      if (l.encrypted_payload && partnerPubKey) {
        try {
          const decrypted = await decryptData<any>(l.encrypted_payload, partnerPubKey);
          if (decrypted) {
            data = { ...data, ...decrypted };
          }
        } catch (decryptError) {
          console.warn('[DataContext] Failed to decrypt log payload, using raw data:', decryptError);
        }
      }

      return {
        ...data,
        energyLevel: data.energy_level || data.energyLevel,
        sleepQuality: data.sleep_quality || data.sleepQuality,
        sleepHours: data.sleep_hours || data.sleepHours
      };
    };

  // 1. Subscribe to own daily logs & settings (Real-time Sync)
  useEffect(() => {
    if (!user || !sessionVerified) return;

    const logsChannel = supabase
      .channel(`user_logs_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_logs', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLog = await mapLog(payload.new);
            setLogs(prev => [newLog, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
          } else if (payload.eventType === 'UPDATE') {
            const updatedLog = await mapLog(payload.new);
            setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setLogs(prev => prev.filter(l => l.id !== deletedId));
          }
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel(`user_settings_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            let s = payload.new as any;

            if (s.encrypted_payload && partnerPubKey) {
              const decrypted = await decryptData<any>(s.encrypted_payload, partnerPubKey);
              if (decrypted) s = { ...s, ...decrypted };
            }

            setCycleSettings({
              avgCycleLength: s.avg_cycle_length || s.avgCycleLength || 28,
              avgPeriodLength: s.avg_period_length || s.avgPeriodLength || 5,
              lastPeriodStart: s.last_period_start || s.lastPeriodStart || '',
              onboardingCompleted: s.onboarding_completed ?? s.onboardingCompleted ?? false,
              irregularCycle: s.irregular_cycle ?? s.irregularCycle ?? false
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [user?.id, sessionVerified, partnerPubKey]);

  // 2. Load Data from Supabase & Subscribe to Notifications
  useEffect(() => {
    // Don't fetch until supabase session JWT is actually verified
    if (!sessionVerified) return;

    if (!user) {
      setLogs([]);
      setCycleSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    // Admin users don't need cycle data - skip fetching and set loading false
    if (user.role === 'admin') {
      setLogs([]);
      setCycleSettings({ ...DEFAULT_SETTINGS, onboardingCompleted: true });
      setLoading(false);
      return;
    }

    // Partner/supporter users don't track periods - bypass onboarding
    if (user.role === 'partner' || user.user_metadata?.is_partner === true) {
      setLogs([]);
      setCycleSettings({ ...DEFAULT_SETTINGS, onboardingCompleted: true });
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // If cache is present, loading is already false — fetch silently in the background
      const hasCachedData = cycleSettings.onboardingCompleted && cycleSettings.lastPeriodStart && logs.length > 0;
      if (!hasCachedData) {
        setLoading(true);
      }

      try {
        // 🚀 PARALLEL: Fire all 3 queries simultaneously instead of sequentially
        const [logsResult, settingsResult, notifResult] = await Promise.all([
          supabase
            .from('daily_logs')
            .select('id,date,flow,moods,symptoms,notes,energy_level,sleep_hours,sleep_quality,encrypted_payload,created_at')
            .eq('user_id', user.id),
          supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('notifications')
            .select('id,type,message,is_read,created_at,encrypted_payload')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)
        ]);

        // Process logs
        const { data: logsData, error: logsError } = logsResult;
        if (logsError) throw logsError;
        if (logsData) {
          const mappedLogs = await Promise.all((logsData as any[]).map(l => mapLog(l)));
          setLogs(mappedLogs);
          setCachedLogs(user.id, mappedLogs);
        }

        // Process settings
        const { data: settingsData, error: settingsError } = settingsResult;
        if (!settingsError && settingsData) {
          let s = settingsData as any;
          
          if (s.encrypted_payload && partnerPubKey) {
            const decrypted = await decryptData<any>(s.encrypted_payload, partnerPubKey);
            if (decrypted) s = { ...s, ...decrypted };
          }

          let effectiveStart = s.last_period_start || s.lastPeriodStart || '';
          if (!effectiveStart && logsData && logsData.length > 0) {
            const sortedLogs = [...(logsData as any[])].sort((a, b) => b.date.localeCompare(a.date));
            const latestFlowLog = sortedLogs.find(l => l.flow);
            if (latestFlowLog) effectiveStart = latestFlowLog.date;
          }

          const newSettings = {
            avgCycleLength: s.avg_cycle_length || s.avgCycleLength || 28,
            avgPeriodLength: s.avg_period_length || s.avgPeriodLength || 5,
            lastPeriodStart: effectiveStart,
            onboardingCompleted: s.onboarding_completed ?? s.onboardingCompleted ?? false,
            irregularCycle: s.irregular_cycle ?? s.irregularCycle ?? false
          };
          setCycleSettings(newSettings);
          setCachedSettings(user.id, newSettings);
        } else if (settingsError && settingsError.code === 'PGRST116') {
          setCycleSettings({ ...DEFAULT_SETTINGS, onboardingCompleted: false });
        }

        // Process notifications
        const { data: notifData, error: notifError } = notifResult;
        if (!notifError && notifData) {
          const mapped = await Promise.all((notifData as any[]).map(async (n: any) => {
            let message = n.message;
            if (n.encrypted_payload && partnerPubKey) {
              const decrypted = await decryptData<{ message: string }>(n.encrypted_payload, partnerPubKey);
              if (decrypted) message = decrypted.message;
            }
            return {
              id: n.id,
              type: n.type,
              message: message,
              isRead: n.is_read,
              timestamp: n.created_at
            };
          }));
          setNotifications(mapped);
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
        async (payload) => {
          const newNotif = payload.new as any;
          let message = newNotif.message;
          
          if (newNotif.encrypted_payload && partnerPubKey) {
            const decrypted = await decryptData<{ message: string }>(newNotif.encrypted_payload, partnerPubKey);
            if (decrypted) message = decrypted.message;
          }

          const mapped: AppNotification = {
            id: newNotif.id,
            type: newNotif.type,
            message: message,
            isRead: false,
            timestamp: newNotif.created_at || new Date().toISOString()
          };
          setNotifications(prev => [mapped, ...prev]);
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
             try { new Notification('Twilight Garden', { body: mapped.message, icon: '/twilight.png' }); } catch { }
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
      await (supabase.from('notifications') as any).update({ is_read: true } as any).eq('id', id);
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
    setCachedLogs(user.id, updatedLogs);

    // Persist to Supabase
    try {
      const payload: Partial<DailyLog> = {
        flow: newLog.flow,
        moods: newLog.moods,
        symptoms: newLog.symptoms,
        notes: newLog.notes,
        energyLevel: newLog.energyLevel,
        sleepQuality: newLog.sleepQuality,
        sleepHours: newLog.sleepHours
      };

      let encryptedPayload = null;
      if (partnerPubKey) {
        encryptedPayload = await encryptData(payload, partnerPubKey);
      }

      const { error } = await supabase.from('daily_logs').upsert({
        user_id: user.id,
        date: newLog.date,
        // We still keep the original columns for basic filtering/indexing if needed,
        // but the 'encrypted_payload' is the source of truth now.
        flow: newLog.flow ?? null,
        moods: newLog.moods || [],
        symptoms: newLog.symptoms || [],
        notes: newLog.notes || null,
        energy_level: newLog.energyLevel || null,
        sleep_quality: newLog.sleepQuality || null,
        sleep_hours: newLog.sleepHours || null,
        encrypted_payload: encryptedPayload
      } as any, { onConflict: 'user_id,date' });

      if (error) throw error;

      // Trigger Notification if it's a new log for today
      // Fire-and-forget: don't block the save on partner notification
      if (existingIndex === -1) {
        (async () => {
          try {
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
                const { data: partnerProfile } = await supabase
                  .from('profiles')
                  .select('partner_nickname')
                  .eq('id', partnerId)
                  .single();

                const nickname = (partnerProfile as any)?.partner_nickname || 'partner';
                const message = `Your ${nickname} has completed their daily log.`;

                let encryptedPayload = null;
                if (partnerPubKey) {
                  encryptedPayload = await encryptData({ message }, partnerPubKey);
                }

                await supabase.from('notifications').insert({
                  user_id: partnerId,
                  type: 'log',
                  message: '[Encrypted Message]',
                  encrypted_payload: encryptedPayload,
                  created_at: new Date().toISOString(),
                  is_read: false
                } as any);
              }
            }
          } catch (notifErr) {
            console.warn('Partner notification failed:', notifErr);
          }
        })();
      }
      
      // Trigger instant real-time sync for partner
      broadcastUpdate('log');
    } catch (err) {
      console.error("Failed to save log:", err);
    }
  };

  const getLog = (date: string) => logs.find(l => l.date === date);

  const updateSettings = async (updates: Partial<CycleSettings>) => {
    const newSettings = { ...cycleSettings, ...updates };
    setCycleSettings(newSettings);
    if (user) {
        setCachedSettings(user.id, newSettings);
    }

    if (user) {
      try {
        const payload = {
          avgCycleLength: newSettings.avgCycleLength,
          avgPeriodLength: newSettings.avgPeriodLength,
          lastPeriodStart: newSettings.lastPeriodStart,
          onboardingCompleted: newSettings.onboardingCompleted,
          irregularCycle: newSettings.irregularCycle
        };

        let encryptedPayload = null;
        if (partnerPubKey) {
          encryptedPayload = await encryptData(payload, partnerPubKey);
        }

        const { error } = await supabase.from('user_settings').upsert({
          user_id: user.id,
          avg_cycle_length: newSettings.avgCycleLength,
          avg_period_length: newSettings.avgPeriodLength,
          last_period_start: newSettings.lastPeriodStart || null,
          onboarding_completed: newSettings.onboardingCompleted,
          irregular_cycle: newSettings.irregularCycle,
          encrypted_payload: encryptedPayload
        } as any);
        if (error) throw error;
        
        // Trigger instant real-time sync for partner
        broadcastUpdate('settings');
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
    }

    // Deduplicate before firing system notifications
    setNotifications(prev => {
      const added = newNotifications.filter(n => !prev.some(p => p.id === n.id));
      if (added.length === 0) return prev;

      // Fire system notifications outside the state updater
      queueMicrotask(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const periodAlert = added.find(n => n.type === 'period_start');
          if (periodAlert) {
            try { new Notification('Cycle Alert', { body: periodAlert.message, icon: '/icon.png' }); } catch (e) { /* */ }
          }
          const reminder = added.find(n => n.type === 'reminder');
          if (reminder) {
            try { new Notification('Twilight Garden', { body: reminder.message }); } catch (e) { /* */ }
          }
        }
      });

      return [...prev, ...added];
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
