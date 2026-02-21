// Supabase Edge Function to send Push Notifications via FCM V1 API
// Supports both web and mobile - all tokens stored in user_fcm_tokens
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleAuth } from "npm:google-auth-library@9.4.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let record;
  let userId;
  let type;
  let noteId;
  let table;
  let body: any = {};
  
  try {
     body = await req.json();
     record = body.record;
     userId = body.userId; 
     type = body.type || 'chat'; 
     table = body.table;
     noteId = body.noteId || (record ? record.id : null);
  } catch (err) {
      console.error("Error parsing JSON:", err);
      return new Response(JSON.stringify({ error: "Invalid JSON body", details: err.message }), { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Resolve Recipient if this is a Database Webhook
  if (!userId && record && record.couple_id && record.sender_id) {
      try {
          const coupleRes = await fetch(`${supabaseUrl}/rest/v1/couples?id=eq.${record.couple_id}&select=partner_1_id,partner_2_id`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          });
          const coupleData = await coupleRes.json();
          if (coupleData && coupleData.length > 0) {
              const c = coupleData[0];
              if (c.partner_1_id === record.sender_id) userId = c.partner_2_id;
              else if (c.partner_2_id === record.sender_id) userId = c.partner_1_id;
          }
      } catch (e) {
          console.error("Error resolving couple partner:", e);
      }
  }
  
  const targetUserId = userId;

  if (targetUserId) {
    const serviceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT');
    
    if (!serviceAccountJson) {
        console.error("FCM_SERVICE_ACCOUNT secret not set");
        return new Response(JSON.stringify({ error: "FCM not configured" }), { status: 500, headers: corsHeaders });
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const projectId = serviceAccount.project_id;
        
        // Get FCM access token
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

        if (!accessToken) throw new Error("Failed to generate FCM access token");

        // Fetch ALL FCM tokens for this user (web + mobile)
        const fcmRes = await fetch(`${supabaseUrl}/rest/v1/user_fcm_tokens?user_id=eq.${targetUserId}&select=id,token,device_type`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const fcmTokens = await fcmRes.json();
        console.log(`[FCM] Found ${fcmTokens?.length || 0} tokens for user ${targetUserId}`);

        if (fcmTokens && fcmTokens.length > 0) {
            // Get the nickname preference of the recipient (what they call the sender)
            let nickname = 'partner';
            try {
                const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${targetUserId}&select=partner_nickname`, {
                    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
                });
                const profileData = await profileRes.json();
                if (profileData && profileData.length > 0 && profileData[0].partner_nickname) {
                    nickname = profileData[0].partner_nickname;
                }
            } catch (e) {
                console.error("[FCM] Error fetching nickname:", e);
            }

            let messageBody = body.message;
            if (!messageBody && record) {
                if (table === 'shared_notes' || record.content) {
                    const content = record.content || "";
                    messageBody = content.length > 50 ? `New love note from your ${nickname} ❤️` : `${nickname}: ${content}`;
                } else {
                    messageBody = record.message || "You have a new message!";
                }
            }
            if (!messageBody) messageBody = "You have a new message!";

            const url = body.url || (type === 'chat' || table === 'shared_notes' ? '/love-lock' : '/');

            const promises = fcmTokens.map(async (t: any) => {
                const fcmPayload: any = {
                    message: {
                        token: t.token,
                        notification: {
                            title: 'Twilight Garden',
                            body: messageBody
                        },
                        data: {
                            url: url,
                            noteId: noteId ? String(noteId) : "",
                            type: type
                        },
                    }
                };

                // Add Android-specific config for mobile tokens
                if (t.device_type === 'android') {
                    fcmPayload.message.android = {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            click_action: 'FCM_PLUGIN_ACTIVITY',
                            channelId: 'PushNotifications'
                        }
                    };
                }

                // Add web-specific config
                if (t.device_type === 'web') {
                    fcmPayload.message.webpush = {
                        notification: {
                            icon: '/twilight.png',
                            badge: '/twilight.png',
                        },
                        fcm_options: {
                            link: url
                        }
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
                        console.error(`[FCM] Error for token ${t.token.substring(0, 20)}... (${t.device_type}):`, JSON.stringify(errData));
                        
                        // Delete invalid/unregistered tokens
                        const errorCode = errData?.error?.details?.[0]?.errorCode || errData?.error?.status;
                        if (res.status === 404 || errorCode === 'UNREGISTERED' || errorCode === 'NOT_FOUND') {
                            console.log(`[FCM] Deleting invalid token ${t.id}`);
                            await fetch(`${supabaseUrl}/rest/v1/user_fcm_tokens?id=eq.${t.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'apikey': supabaseKey,
                                    'Authorization': `Bearer ${supabaseKey}`,
                                }
                            });
                        }
                    } else {
                        console.log(`[FCM] ✅ Sent to ${t.device_type} token ${t.token.substring(0, 20)}...`);
                    }
                } catch (e) {
                    console.error(`[FCM] Send error for ${t.device_type}:`, e);
                }
            });

            await Promise.all(promises);
        }
    } catch (e) {
        console.error("[FCM] Error:", e);
    }

    // Mark chat note as delivered
    const isChat = type === 'chat' || (record && table === 'shared_notes') || (type === 'INSERT' && table === 'shared_notes');
    if (noteId && isChat) {
       console.log(`Updating status for note ${noteId} to delivered`);
       const updateRes = await fetch(`${supabaseUrl}/rest/v1/shared_notes?id=eq.${noteId}`, {
           method: 'PATCH',
           headers: {
               'apikey': supabaseKey,
               'Authorization': `Bearer ${supabaseKey}`,
               'Content-Type': 'application/json',
               'Prefer': 'return=minimal'
           },
           body: JSON.stringify({ status: 'delivered' })
       });
       if (!updateRes.ok) {
            console.error("Failed to update status:", await updateRes.text());
       }
   }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
