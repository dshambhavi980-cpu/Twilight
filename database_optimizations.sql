-- Database Performance Optimizations for Twilight App
-- Target Latency: 25-50ms

-- 1. INDEXING FOR FAST SEARCH & JOINS
-- Profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Couple lookups (essential for app boot)
CREATE INDEX IF NOT EXISTS idx_couples_partner_1 ON public.couples(partner_1_id);
CREATE INDEX IF NOT EXISTS idx_couples_partner_2 ON public.couples(partner_2_id);
CREATE INDEX IF NOT EXISTS idx_couples_status ON public.couples(status);

-- Data filtering by user/couple
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_shared_notes_couple_created ON public.shared_notes(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 2. CONSOLIDATED APP BOOT DATA (SINGLE ROUND-TRIP)
CREATE OR REPLACE FUNCTION public.get_app_boot_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile JSONB;
  v_couple JSONB;
  v_settings JSONB;
  v_notes JSONB;
  v_logs JSONB;
  v_notifications JSONB;
BEGIN
  -- 1. Fetch Profile
  SELECT jsonb_build_object(
    'id', id,
    'full_name', full_name,
    'avatar_url', avatar_url,
    'role', role
  ) INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  -- 2. Fetch Active Couple
  SELECT jsonb_build_object(
    'id', id,
    'partner_1_id', partner_1_id,
    'partner_2_id', partner_2_id,
    'status', status,
    'share_enabled', share_enabled,
    'love_unlocked', love_unlocked
  ) INTO v_couple
  FROM public.couples
  WHERE (partner_1_id = p_user_id OR partner_2_id = p_user_id)
    AND status = 'active'
  LIMIT 1;

  -- 3. Fetch Settings
  SELECT jsonb_build_object(
    'avg_cycle_length', avg_cycle_length,
    'avg_period_length', avg_period_length,
    'last_period_start', last_period_start,
    'onboarding_completed', onboarding_completed,
    'encrypted_payload', encrypted_payload
  ) INTO v_settings
  FROM public.user_settings
  WHERE user_id = p_user_id;

  -- 4. Fetch Latest Notes (limit 50)
  SELECT jsonb_agg(n) INTO v_notes
  FROM (
    SELECT id, sender_id, content, type, status, created_at, reply_content, reactions
    FROM public.shared_notes
    WHERE couple_id = (v_couple->>'id')::UUID
    ORDER BY created_at DESC
    LIMIT 50
  ) n;

  -- 5. Fetch Daily Logs (last 30 days)
  SELECT jsonb_agg(l) INTO v_logs
  FROM (
    SELECT id, date, flow, moods, symptoms, notes, energy_level, sleep_hours, sleep_quality, encrypted_payload
    FROM public.daily_logs
    WHERE user_id = p_user_id
    ORDER BY date DESC
    LIMIT 30
  ) l;

  -- 6. Fetch Unread Notifications
  SELECT jsonb_agg(notif) INTO v_notifications
  FROM (
    SELECT id, type, message, is_read, created_at, encrypted_payload
    FROM public.notifications
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 20
  ) notif;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'couple', v_couple,
    'settings', COALESCE(v_settings, '{}'::jsonb),
    'notes', COALESCE(v_notes, '[]'::jsonb),
    'logs', COALESCE(v_logs, '[]'::jsonb),
    'notifications', COALESCE(v_notifications, '[]'::jsonb)
  );
END;
$$;
