// Supabase Edge Function to send Web Push Notifications
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push@3.6.3";

// 1. Set VAPID details (Env vars set in Supabase Dashboard)
const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'admin@example.com';
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey
  );
}

serve(async (req) => {
  let record;
  
  try {
     const body = await req.json();
     record = body.record;
  } catch (err) {
      console.error("Error parsing JSON:", err);
      return new Response(JSON.stringify({ error: "Invalid JSON body", details: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
      });
  }

  // Example: If triggered by 'new notification' insert
  if (record && record.user_id) {
    // 1. Fetch user's subscription
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Simple fetch (or use supabase-js)
    const subRes = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${record.user_id}&select=*`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    
    const subscriptions = await subRes.json();

    if (subscriptions && subscriptions.length > 0) {
       const notificationPayload = JSON.stringify({
         title: 'Twilight Garden',
         body: record.message || "You have a new notification!",
         url: '/' 
       });

       const promises = subscriptions.map((sub: any) => {
         const pushConfig = {
           endpoint: sub.endpoint,
           keys: {
             auth: sub.auth,
             p256dh: sub.p256dh
           }
         };
         return webpush.sendNotification(pushConfig, notificationPayload).catch((err: any) => {
             if (err.statusCode === 410) {
                 // Subscription gone, delete from DB
                 console.log("Subscription expired, should delete", sub.id);
             }
         });
       });

       await Promise.all(promises);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
