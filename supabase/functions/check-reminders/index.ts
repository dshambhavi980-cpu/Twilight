// Supabase Edge Function: check-reminders
// Trigger this with a CRON job every hour.
// Uses FCM V1 API for both web and mobile push notifications.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleAuth } from "npm:google-auth-library@9.4.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- CONFIGURATION ---
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30

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
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // 1. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Determine Current Time in IST
    const istNow = getISTDate();
    const currentHour = istNow.getHours(); // 0 - 23
    const todayStr = normalizeDate(istNow);

    console.log(`Running check-reminders. IST Time: ${istNow.toISOString()}, Hour: ${currentHour}`);

    // 3. Fetch all FCM tokens with user settings
    const { data: allTokens, error: tokenError } = await supabase
        .from('user_fcm_tokens')
        .select(`
            id,
            user_id,
            token,
            device_type,
            user_settings:user_settings!user_id(period_notifications, reminder_notifications)
        `);

    if (tokenError || !allTokens) {
        return new Response(JSON.stringify({ error: tokenError }), { status: 500 });
    }

    // Group tokens by user_id for processing
    const userTokenMap = new Map<string, any[]>();
    const userSettingsMap = new Map<string, any>();
    for (const t of allTokens) {
        if (!userTokenMap.has(t.user_id)) userTokenMap.set(t.user_id, []);
        userTokenMap.get(t.user_id)!.push(t);
        if (t.user_settings && !userSettingsMap.has(t.user_id)) {
            userSettingsMap.set(t.user_id, t.user_settings);
        }
    }

    const notificationsToSend: any[] = [];

    // 4. Iterate Users and Check Logic
    for (const [userId, tokens] of userTokenMap) {
        const settings = userSettingsMap.get(userId);
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
                        userId,
                        title: "Twilight Garden",
                        body: "hey kuchuu puchuu , please log your symptoms into the app 🩷"
                    });
                } else if (currentHour === 15) { // 3 PM
                    notificationsToSend.push({
                        userId,
                        title: "Twilight Garden",
                        body: "hey kuchuu puchuu did you logged the symptoms ? if not please log it 🌸"
                    });
                } else if (currentHour === 20) { // 8 PM
                    notificationsToSend.push({
                        userId,
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
                       userId,
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

    // 6. Send Push Notifications via FCM V1 AND save to database
    console.log(`Sending ${notificationsToSend.length} notifications via FCM...`);
    
    const serviceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT');
    let sentCount = 0;

    if (serviceAccountJson && notificationsToSend.length > 0) {
        try {
            const serviceAccount = JSON.parse(serviceAccountJson);
            const projectId = serviceAccount.project_id;
            
            // Get OAuth2 access token for FCM V1 API
            const auth = new GoogleAuth({
                credentials: {
                    client_email: serviceAccount.client_email,
                    private_key: serviceAccount.private_key,
                },
                scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
            });
            const client = await auth.getClient();
            const accessTokenResponse = await client.getAccessToken();
            const accessToken = accessTokenResponse.token;

            if (!accessToken) throw new Error("Failed to get FCM access token");

            // Track which notifications have been saved to DB
            const savedNotifications = new Set<string>();

            for (const notif of notificationsToSend) {
                // Save to database (only once per user per message)
                const notifKey = `${notif.userId}-${notif.body}`;
                if (!savedNotifications.has(notifKey)) {
                    savedNotifications.add(notifKey);
                    await supabase.from('notifications').insert({
                        user_id: notif.userId,
                        type: notif.title.includes('Cycle') ? 'period_start' : 'reminder',
                        message: notif.body
                    });
                }

                // Get all FCM tokens for this user
                const tokens = userTokenMap.get(notif.userId) || [];
                
                for (const tokenEntry of tokens) {
                    const fcmPayload: any = {
                        message: {
                            token: tokenEntry.token,
                            notification: {
                                title: notif.title,
                                body: notif.body
                            },
                            data: { url: '/' },
                        }
                    };

                    // Platform-specific config
                    if (tokenEntry.device_type === 'android') {
                        fcmPayload.message.android = {
                            priority: 'high',
                            notification: {
                                sound: 'default',
                                channelId: 'PushNotifications'
                            }
                        };
                    }
                    if (tokenEntry.device_type === 'web') {
                        fcmPayload.message.webpush = {
                            notification: {
                                icon: '/twilight.png',
                                badge: '/twilight.png',
                            },
                            fcm_options: { link: '/' }
                        };
                    }

                    try {
                        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`
                            },
                            body: JSON.stringify(fcmPayload)
                        });

                        if (!res.ok) {
                            const errData = await res.json();
                            console.error(`[FCM] Error for ${tokenEntry.device_type} token:`, JSON.stringify(errData));
                            const errorCode = errData?.error?.details?.[0]?.errorCode || errData?.error?.status;
                            if (res.status === 404 || errorCode === 'UNREGISTERED' || errorCode === 'NOT_FOUND') {
                                await supabase.from('user_fcm_tokens').delete().eq('id', tokenEntry.id);
                                console.log(`[FCM] Deleted expired token ${tokenEntry.id}`);
                            }
                        } else {
                            sentCount++;
                            console.log(`[FCM] ✅ Sent to user ${notif.userId} (${tokenEntry.device_type})`);
                        }
                    } catch (fcmErr) {
                        console.error("[FCM] Send error:", fcmErr);
                    }
                }
            }
        } catch (e) {
            console.error("[FCM] Error:", e);
        }
    } else if (!serviceAccountJson) {
        console.error("FCM_SERVICE_ACCOUNT not set");
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
        headers: { "Content-Type": "application/json" }
    });
});
