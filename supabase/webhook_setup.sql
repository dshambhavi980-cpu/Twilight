-- Enable the pg_net extension to allow making HTTP requests from the database
create extension if not exists pg_net;

-- Create the trigger function
create or replace function public.handle_push_notification()
returns trigger as $$
declare
  service_role_key text;
  ref text;
  url text;
begin
  -- HARDCODED VALUES: REPLACE THESE IF NEEDED
  -- Your Project Ref: awijrkxrhlisixufiukw
  ref := 'awijrkxrhlisixufiukw';
  url := 'https://' || ref || '.supabase.co/functions/v1/push-notifications';
  
  -- We use the anon key or service role key. 
  -- Ideally, fetch this from vault or use a hardcoded safe key for internal calls.
  -- For webhooks, Supabase handles auth automatically if configured in dashboard,
  -- but for manual pg_net calls, we set headers.
  
  -- Send the request
  perform net.http_post(
    url,
    jsonb_build_object(
        'record', row_to_json(new),
        'userId', new.user_id,
        'type', new.type,
        'table', TG_TABLE_NAME
    ),
    '{}'::jsonb, -- headers
    '1000'::integer -- timeout in ms
  );

  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
drop trigger if exists on_notification_created on public.notifications;

create trigger on_notification_created
  after insert on public.notifications
  for each row execute procedure public.handle_push_notification();
