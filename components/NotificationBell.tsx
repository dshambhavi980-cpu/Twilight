import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { formatDistanceToNow } from 'date-fns';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  cancelAllNotifications,
  scheduleDailyReminders,
  schedulePeriodReminder
} from '../lib/notifications';

const NotificationBell: React.FC = () => {
    const { notifications, markAsRead, logs, getCyclePhase } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    
    // Only count notifications from the last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentNotifications = notifications.filter(n => new Date(n.timestamp).getTime() > oneDayAgo);
    
    // Generate synthetic notifications from logs
    const logNotifications = React.useMemo(() => {
        return logs
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5) // Last 5 logs
            .map(log => ({
                id: `log-${log.date}`,
                type: 'log',
                message: `Log added for ${new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                timestamp: new Date(log.date).toISOString(),
                isRead: true
            }));
    }, [logs]);

    // Combine real and log notifications
    const allNotifications = [...recentNotifications, ...logNotifications]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const unreadCount = recentNotifications.filter(n => !n.isRead).length;

    useEffect(() => {
        checkPermissionStatus();
    }, []);

    const checkPermissionStatus = async () => {
        const granted = await checkNotificationPermission();
        setNotificationsEnabled(granted);
    };

    const toggleNotifications = async () => {
        if (notificationsEnabled) {
            // Disable (Cancel all)
            await cancelAllNotifications();
            setNotificationsEnabled(false);
        } else {
            // Enable
            const granted = await requestNotificationPermission();
            setNotificationsEnabled(granted);
            if (granted) {
                await scheduleDailyReminders();
                const cycleData = getCyclePhase();
                await schedulePeriodReminder(cycleData.nextPeriodIn);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = () => {
        notifications.forEach(n => {
            if (!n.isRead) markAsRead(n.id);
        });
    };

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[#121014] dark:text-white"
            >
                <span className="material-symbols-outlined text-2xl">notifications</span>
                
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-[#FDFCF8] dark:border-[#1E1E1E]"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed right-4 top-16 z-50 w-[calc(100vw-2rem)] max-w-80 origin-top-right rounded-2xl bg-white dark:bg-[#252525] p-4 shadow-xl border border-gray-100 dark:border-white/10"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-semibold text-primary hover:text-primary/80"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
                            {/* Toggle Switch Logic */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-xl ${notificationsEnabled ? 'text-green-500' : 'text-gray-400'}`}>
                                        {notificationsEnabled ? 'notifications_active' : 'notifications_off'}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {notificationsEnabled ? 'On' : 'Off'}
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={notificationsEnabled}
                                        onChange={toggleNotifications}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {allNotifications.length === 0 ? (
                                <div className="py-8 text-center text-gray-400 text-sm">
                                    <span className="material-symbols-outlined text-3xl mb-2 opacity-50">notifications_none</span>
                                    <p>No recent activity</p>
                                </div>
                            ) : (
                                allNotifications.map((n) => (
                                    <div 
                                        key={n.id}
                                        onClick={() => n.type !== 'log' && !n.isRead && markAsRead(n.id)}
                                        className={`relative flex items-start gap-3 rounded-xl p-3 transition-colors ${n.isRead ? 'opacity-75 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-white/5' : 'bg-primary/5 hover:bg-primary/10'}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.isRead ? (n.type === 'log' ? 'bg-green-400' : 'bg-transparent') : 'bg-primary'}`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug mb-1">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {n.timestamp ? formatDistanceToNow(new Date(n.timestamp), { addSuffix: true }) : 'Just now'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
