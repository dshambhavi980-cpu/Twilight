-- 1. Ensure the supabase_realtime publication exists
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- 2. Add relevant tables to the publication
-- We use unique names to avoid errors if they are already added
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.user_settings;
alter publication supabase_realtime add table public.daily_logs;
alter publication supabase_realtime add table public.shared_notes;

-- 3. Set replica identity to FULL
-- This ensures that the 'old' record is included in UPDATE/DELETE events
-- and that all columns are present even if they haven't changed.
alter table public.profiles replica identity full;
alter table public.user_settings replica identity full;
alter table public.daily_logs replica identity full;
alter table public.shared_notes replica identity full;

-- 4. Verify (Optional check)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
