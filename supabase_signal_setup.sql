-- SUPABASE SETUP FOR SIGNAL PROTOCOL (v3)

-- 1. Create table for One-time Pre-keys
CREATE TABLE IF NOT EXISTS public.user_pre_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  public_key_b64 text NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS for user_pre_keys
ALTER TABLE public.user_pre_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own pre-keys" ON public.user_pre_keys;
CREATE POLICY "Users can manage their own pre-keys" 
ON public.user_pre_keys FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partners can view each other's pre-keys" ON public.user_pre_keys;
CREATE POLICY "Partners can view each other's pre-keys" 
ON public.user_pre_keys FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.couples c
    WHERE (c.partner_1_id = auth.uid() AND c.partner_2_id = user_id)
       OR (c.partner_2_id = auth.uid() AND c.partner_1_id = user_id)
  )
);

-- 2. Create table for Session Backups (Recovery)
CREATE TABLE IF NOT EXISTS public.e2ee_session_backups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  partner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_session_state text NOT NULL, -- This is the JSON string of SignalSessionState
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS for e2ee_session_backups
ALTER TABLE public.e2ee_session_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own session backups" ON public.e2ee_session_backups;
CREATE POLICY "Users can manage their own session backups" 
ON public.e2ee_session_backups FOR ALL TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Update shared_notes table
ALTER TABLE public.shared_notes ADD COLUMN IF NOT EXISTS sender_device_id TEXT;
ALTER TABLE public.shared_notes ADD COLUMN IF NOT EXISTS v INTEGER DEFAULT 1;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_pre_keys_user_device ON public.user_pre_keys(user_id, device_id) WHERE is_used = false;
CREATE INDEX IF NOT EXISTS idx_session_backups_user_device ON public.e2ee_session_backups(user_id, device_id);
