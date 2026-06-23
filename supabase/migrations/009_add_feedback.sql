-- Generic in-app feedback / support requests.
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  category text,                       -- 'support' | 'bug' | 'feedback'
  message text not null,
  context text,                        -- where it was sent from, e.g. 'pds-setup-error'
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

-- Signed-in users may submit their own feedback; reads are service-role only.
create policy "feedback_insert_own" on feedback
  for insert to authenticated
  with check (user_id = auth.uid());
