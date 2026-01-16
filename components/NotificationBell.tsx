import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationBell: React.FC = () => {
    // ... existing hook calls ...
    const { notifications, markAsRead } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Only count notifications from the last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentNotifications = notifications.filter(n => new Date(n.timestamp).getTime() > oneDayAgo);
    const unreadCount = recentNotifications.filter(n => !n.isRead).length;

    // ... existing useEffects ...
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    }, []);

    const handleMarkAllRead = () => {
        notifications.forEach(n => {
            if (!n.isRead) markAsRead(n.id);
        });
    };

    const subscribeToPush = async () => {
        if (!("serviceWorker" in navigator)) return;

        try {
            if (!navigator.serviceWorker || !('PushManager' in window)) {
                throw new Error("Push notifications not supported on this browser");
            }

            const reg = await navigator.serviceWorker.ready;
            if (!reg.pushManager) {
                 throw new Error("PushManager not available");
            }

            const VAPID_PUBLIC_KEY = 'BIxaX4QElQvsmusueMLzTUIgUm5O8x1PjkD6NOkjU10Xc8gxJNJHLS-wHN-Aphg7knWXI_U-cfwj2QHMXELTTdI'.trim();
            const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

            let sub = await reg.pushManager.getSubscription();

            if (sub) {
                // Check if existing subscription has the same key? 
                // It's hard to compare ArrayBuffers directly without utility, but usually if it exists, it's valid.
                console.log("Found existing subscription:", sub);
                // We will reuse this subscription instead of unsubscribing
            } else {
                console.log("No existing subscription, subscribing...");
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            }

            console.log("Subscription object:", sub);

            // 2. Save to Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user && sub) {
                // Serialize keys properly
                const p256dh = sub.getKey('p256dh');
                const auth = sub.getKey('auth');

                if (!p256dh || !auth) {
                    throw new Error("Failed to retrieve subscription keys");
                }

                const { error } = await supabase.from('push_subscriptions').upsert({
                    user_id: user.id,
                    endpoint: sub.endpoint,
                    p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(p256dh) as any)),
                    auth: btoa(String.fromCharCode.apply(null, new Uint8Array(auth) as any))
                } as any, { onConflict: 'endpoint' });
                
                if (error) throw error;
                console.log("Subscription saved to Supabase");
            }

            // Use ServiceWorker showNotification for mobile compatibility
            await reg.showNotification("Push Enabled", { 
                body: "You will receive notifications even when the app is closed.",
                icon: '/pwa-192x192.png'
            });
        
        } catch (err: any) {
            console.error("Failed to subscribe to push:", err);
            if (err.name === 'NotAllowedError') {
                alert("Permission Denied: Please click the 'Lock' icon in your browser address bar and 'Reset Permissions' or 'Allow' Notifications.");
            } else if (err.name === 'AbortError') {
                 alert("Push Service Error: Please try clearing your browser cache/site data or unregistering service workers in DevTools.");
            } else {
                alert(`Failed to enable push notifications: ${err.message}`);
            }
        }
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
                            <button 
                                onClick={subscribeToPush}
                                className="w-full mb-2 bg-primary/10 text-primary text-xs font-bold py-2 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">notifications_active</span>
                                Enable Push Notifications
                            </button>

                            {notifications.length === 0 ? (
                                <div className="py-8 text-center text-gray-400 text-sm">
                                    <span className="material-symbols-outlined text-3xl mb-2 opacity-50">notifications_off</span>
                                    <p>No new notifications</p>
                                </div>
                            ) : (
                                // Filter out notifications older than 24 hours
                                notifications
                                    .filter(n => {
                                        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                                        return new Date(n.timestamp).getTime() > oneDayAgo;
                                    })
                                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map((n) => (
                                    <div 
                                        key={n.id}
                                        onClick={() => !n.isRead && markAsRead(n.id)}
                                        className={`relative flex items-start gap-3 rounded-xl p-3 transition-colors ${n.isRead ? 'opacity-60 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-white/5' : 'bg-primary/5 hover:bg-primary/10'}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-primary'}`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug mb-1">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
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
