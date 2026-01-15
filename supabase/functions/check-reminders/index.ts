// Supabase Edge Function: check-reminders
// Trigger this with a CRON job every hour.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push@3.6.3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// --- CONFIGURATION ---
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30

// Setup WebPush
const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'admin@example.com';
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey);
}

// Helpers
function getISTDate() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + IST_OFFSET);
}

function normalizeDate(d: Date) {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

serve(async (req) => {
    // 1. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Determine Current Time in IST
    const istNow = getISTDate();
    const currentHour = istNow.getHours(); // 0 - 23
    const todayStr = normalizeDate(istNow);

    console.log(`Running check-reminders. IST Time: ${istNow.toISOString()}, Hour: ${currentHour}`);

    // 3. Fetch all subscriptions with user settings
    const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select(`
            *,
            user_settings:user_settings!user_id(period_notifications, reminder_notifications)
        `);

    if (subError || !subscriptions) {
        return new Response(JSON.stringify({ error: subError }), { status: 500 });
    }

    const notificationsToSend = [];

    // 4. Iterate Subscriptions and Check Logic
    for (const sub of subscriptions) {
        const userId = sub.user_id;
        
        // CHECK SETTINGS: Get individual preferences
        const settings = sub.user_settings;
        const periodNotificationsEnabled = settings?.period_notifications !== false;
        const reminderNotificationsEnabled = settings?.reminder_notifications !== false;
        
        // --- LOGIC A: DAILY LOG REMINDERS ---
        // Only if reminder_notifications is enabled
        if (reminderNotificationsEnabled) {
            const { data: logs } = await supabase
                .from('logs')
                .select('date')
                .eq('user_id', userId)
                .eq('date', todayStr)
                .single();

            const hasLoggedToday = !!logs;

            if (!hasLoggedToday) {
                if (currentHour === 0) { // 12 AM
                    notificationsToSend.push({
                        sub,
                        title: "Twilight Garden",
                        body: "hey kuchuu puchuu , please log your symptoms into the app 🩷"
                    });
                } else if (currentHour === 15) { // 3 PM
                    notificationsToSend.push({
                        sub,
                        title: "Twilight Garden",
                        body: "hey kuchuu puchuu did you logged the symptoms ? if not please log it 🌸"
                    });
                } else if (currentHour === 20) { // 8 PM
                    notificationsToSend.push({
                        sub,
                        title: "Twilight Garden",
                        body: "hey kuchuu puchuu if you have logged todays symptoms goog girls else please log kariye 🥰"
                    });
                }
            }
        }

        // --- LOGIC B: PERIOD PREDICTION ---
        // Run this check only at 1 PM (13:00) AND if period_notifications is enabled
        if (currentHour === 13 && periodNotificationsEnabled) {
            const { data: latestCycle } = await supabase
                .from('cycles')
                .select('start_date')
                .eq('user_id', userId)
                .order('start_date', { ascending: false })
                .limit(1)
                .single();

            if (latestCycle) {
               const { data: cycles } = await supabase.from('cycles').select('length').eq('user_id', userId).limit(5);
               const avgLength = cycles && cycles.length > 0 
                    ? Math.round(cycles.reduce((a, b) => a + b.length, 0) / cycles.length) 
                    : 28;

               const lastStart = new Date(latestCycle.start_date);
               const nextPeriod = new Date(lastStart);
               nextPeriod.setDate(lastStart.getDate() + avgLength);

               const diffTime = nextPeriod.getTime() - new Date(todayStr).getTime();
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

               if (diffDays === 3 || diffDays === 2 || diffDays === 1) {
                   notificationsToSend.push({
                       sub,
                       title: "Cycle Update 🌸",
                       body: `hey kuchuu puchuu your period is in ${diffDays} days 🌸`
                   });
               }
            }
        }
    }

    // 5. Clean up old notifications (older than 24 hours)
    console.log("Cleaning up old notifications...");
    await supabase.from('notifications').delete().lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // 6. Send Push Notifications AND save to database
    console.log(`Sending ${notificationsToSend.length} notifications...`);
    
    // Group by user to avoid duplicate DB entries for multi-device users
    const userNotifications = new Map();
    
    const results = await Promise.all(notificationsToSend.map(async n => {
        // Save to database (only once per user per message)
        const notifKey = `${n.sub.user_id}-${n.body}`;
        if (!userNotifications.has(notifKey)) {
            userNotifications.set(notifKey, true);
            await supabase.from('notifications').insert({
                user_id: n.sub.user_id,
                type: n.title.includes('Cycle') ? 'period_start' : 'reminder',
                message: n.body
            });
        }

        // Send push notification
        const payload = JSON.stringify({
            title: n.title,
            body: n.body,
            url: '/'
        });
        const pushConfig = {
            endpoint: n.sub.endpoint,
            keys: { auth: n.sub.auth, p256dh: n.sub.p256dh }
        };
        return webpush.sendNotification(pushConfig, payload).catch(err => {
            if (err.statusCode === 410) {
                 // Cleanup expired subscription
                 supabase.from('push_subscriptions').delete().eq('id', n.sub.id);
            }
            return err;
        });
    }));

    return new Response(JSON.stringify({ success: true, sent: results.length }), {
        headers: { "Content-Type": "application/json" }
    });
});
