-- 1. Create the user_fcm_tokens table if it doesn't exist
create table if not exists public.user_fcm_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  token text not null,
  device_type text not null,
  updated_at timestamptz default now()
);

-- 2. Add indexes for performance
create index if not exists idx_user_fcm_tokens_user_id on public.user_fcm_tokens(user_id);
create index if not exists idx_user_fcm_tokens_token on public.user_fcm_tokens(token);

-- 3. Enable RLS
alter table public.user_fcm_tokens enable row level security;

-- 4. Create Policies (Drop first to avoid conflicts)
drop policy if exists "Users can view their own fcm tokens" on public.user_fcm_tokens;
drop policy if exists "Users can insert fcm tokens" on public.user_fcm_tokens;
drop policy if exists "Users can update their own fcm tokens" on public.user_fcm_tokens;

drop policy if exists "Service role can select fcm tokens" on public.user_fcm_tokens;

create policy "Users can view their own fcm tokens" 
on public.user_fcm_tokens for select 
using (auth.uid() = user_id);

create policy "Users can insert fcm tokens" 
on public.user_fcm_tokens for insert 
with check (auth.role() = 'authenticated');

create policy "Users can update their own fcm tokens" 
on public.user_fcm_tokens for update 
using (auth.uid() = user_id);

create policy "Service role can select fcm tokens" 
on public.user_fcm_tokens for select 
using (true);

-- 5. Grant permissions
grant all on public.user_fcm_tokens to authenticated;
grant all on public.user_fcm_tokens to service_role;
