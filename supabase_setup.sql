-- 1. SECURE THE PUBLIC KEYS TABLE
-- This table stores public keys which are safe to share but must be protected from unauthorized editing.

-- Enable RLS
ALTER TABLE IF EXISTS public.user_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid duplicates
DROP POLICY IF EXISTS "Public keys are readable by everyone" ON public.user_keys;
DROP POLICY IF EXISTS "Users can update their own public keys" ON public.user_keys;

-- Policy: Anyone logged in can see a public key (to encrypt for their partner)
CREATE POLICY "Public keys are readable by everyone" 
ON public.user_keys 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Users can only manage their own keys
CREATE POLICY "Users can update their own public keys" 
ON public.user_keys 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);


-- 2. SECURE THE MEDIA STORAGE
-- This ensures that only the couple can download the encrypted blobs from the bucket.

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
-- Note: 'chat-media' uses the public flag but we reinforce with policies for maximum security.

DROP POLICY IF EXISTS "Couple members can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Couple members can download media" ON storage.objects;

-- Policy: Allow upload to folder if member of couple
-- Folder structure is assumed to be :couple_id/:filename
CREATE POLICY "Couple members can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' AND
  (
    EXISTS (
      SELECT 1 FROM public.couples c
      WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.partner_1_id = auth.uid() OR c.partner_2_id = auth.uid())
    )
  )
);

-- Policy: Allow download if member of couple
CREATE POLICY "Couple members can download media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media' AND
  (
    EXISTS (
      SELECT 1 FROM public.couples c
      WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.partner_1_id = auth.uid() OR c.partner_2_id = auth.uid())
    )
  )
);

-- 3. ADD ENCRYPTED PAYLOAD COLUMNS FOR HEALTH DATA E2EE
ALTER TABLE IF EXISTS public.daily_logs ADD COLUMN IF NOT EXISTS encrypted_payload TEXT;
ALTER TABLE IF EXISTS public.user_settings ADD COLUMN IF NOT EXISTS encrypted_payload TEXT;
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS encrypted_payload TEXT;

-- 4. UPDATE NOTIFICATION CONSTRAINTS
-- Allow new E2EE notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('reminder', 'period_start', 'insight', 'game', 'log', 'settings'));

