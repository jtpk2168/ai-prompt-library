-- Feedback table for student submissions
create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  user_name text not null default '',
  category text not null default 'general',
  message text not null,
  status text not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now()
);

-- Indexes
create index feedback_status_idx on feedback(status);
create index feedback_created_at_idx on feedback(created_at desc);
create index feedback_user_id_idx on feedback(user_id);

-- RLS
alter table feedback enable row level security;

-- Authenticated users can insert their own feedback
create policy "feedback_user_insert" on feedback
  for insert with check (auth.uid() is not null);

-- Users can read their own feedback
create policy "feedback_user_read" on feedback
  for select using (
    user_id = (select auth.uid()) or (select is_admin())
  );

-- Admins can update (change status, add notes)
create policy "feedback_admin_update" on feedback
  for update using ((select is_admin()));

-- Admins can delete
create policy "feedback_admin_delete" on feedback
  for delete using ((select is_admin()));
