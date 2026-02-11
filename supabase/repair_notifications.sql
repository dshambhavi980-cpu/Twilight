-- 1. Create the notifications table if it doesn't exist
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  type text not null check (type in ('reminder', 'period_start', 'insight', 'game')),
  message text not null,
  is_read boolean default false,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 2. Add 'data' column if it's missing (idempotent)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'data') then
    alter table public.notifications add column data jsonb default '{}'::jsonb;
  end if;
end $$;

-- 3. Enable RLS
alter table public.notifications enable row level security;

-- 4. Create Policies (Drop first to avoid conflicts)
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can insert notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;

create policy "Users can view their own notifications" 
on public.notifications for select 
using (auth.uid() = user_id);

-- Allow authenticated users to insert (necessary for sending game invites to partners)
create policy "Users can insert notifications" 
on public.notifications for insert 
with check (auth.role() = 'authenticated');

create policy "Users can update their own notifications" 
on public.notifications for update 
using (auth.uid() = user_id);

-- 5. Grant permissions
grant all on public.notifications to authenticated;
grant all on public.notifications to service_role;
