import { useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useCouples } from '../contexts/CouplesContext';
import { differenceInDays, startOfDay } from 'date-fns';

export const useWidgetSync = () => {
    const { user } = useAuth();
    const { logs, cycleSettings } = useData();
    const { partnerProfile, partnerData } = useCouples();

    useEffect(() => {
        if (!user) return;

        const syncData = async () => {
            try {
                // Calculate cycle day
                let cycleDay = 1;
                let phase = 'Follicular';
                if (cycleSettings?.lastPeriodStart) {
                    const start = new Date(cycleSettings.lastPeriodStart);
                    cycleDay = differenceInDays(startOfDay(new Date()), startOfDay(start)) + 1;
                    
                    if (cycleDay > 14) phase = 'Luteal';
                    if (cycleDay > 28) cycleDay = cycleDay % 28 || 28;
                }

                const payload = {
                    partner: {
                        name: partnerProfile?.full_name || 'Partner',
                        mood: partnerData?.current_mood?.emoji || '🤩',
                        online: partnerData?.status === 'online'
                    },
                    cycle: {
                        day: cycleDay,
                        phase: phase,
                        maxDays: cycleSettings?.cycleLength || 28
                    },
                    note: {
                        content: partnerData?.last_note?.content || 'No new notes.',
                        time: partnerData?.last_note?.timestamp ? 'Recently' : 'Just now'
                    },
                    activity: {
                        streak: partnerData?.activity_streak || 7
                    },
                    updatedAt: new Date().toISOString()
                };

                // Save to Capacitor Preferences (which maps to SharedPreferences on Android)
                // We use a specific key that the native side will watch
                await Preferences.set({
                    key: 'twilight_widget_payload',
                    value: JSON.stringify(payload)
                });

                console.log('[WidgetSync] Data synchronized for native widgets');
            } catch (e) {
                console.error('[WidgetSync] Failed to sync data', e);
            }
        };

        syncData();
    }, [user, logs, cycleSettings, partnerProfile, partnerData]);
};
