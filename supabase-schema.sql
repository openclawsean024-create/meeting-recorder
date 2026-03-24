-- Meeting Recorder — Supabase Schema Setup
-- Run this in the Supabase SQL Editor to initialize the database.
-- https://supabase.com/dashboard -> SQL Editor -> New Query

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text default '',
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User API keys (encrypted storage)
create table if not exists public.user_api_keys (
  user_id uuid primary key references public.users(id) on delete cascade,
  api_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transcription jobs
create table if not exists public.transcription_jobs (
  job_id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  meeting_title text not null default '未命名會議',
  participants text default '',
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  progress integer not null default 0,
  transcript text default '',
  summary text default '',
  minutes numeric(8,2) default 0,
  error text,
  created_at timestamptz not null default now()
);

-- Usage records
create table if not exists public.usage_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id text,
  characters integer default 0,
  minutes numeric(8,2) default 0,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_transcription_jobs_user_id on public.transcription_jobs(user_id);
create index if not exists idx_transcription_jobs_created_at on public.transcription_jobs(created_at desc);
create index if not exists idx_usage_records_user_id on public.usage_records(user_id);
create index if not exists idx_usage_records_created_at on public.usage_records(created_at);

-- Row Level Security
alter table public.users enable row level security;
alter table public.user_api_keys enable row level security;
alter table public.transcription_jobs enable row level security;
alter table public.usage_records enable row level security;

-- Users: users can only see/edit their own row
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- User API keys: only the owner can access
create policy "Owner can view own api key" on public.user_api_keys for select using (auth.uid() = user_id);
create policy "Owner can insert own api key" on public.user_api_keys for insert with check (auth.uid() = user_id);
create policy "Owner can update own api key" on public.user_api_keys for update using (auth.uid() = user_id);
create policy "Owner can delete own api key" on public.user_api_keys for delete using (auth.uid() = user_id);

-- Transcription jobs: only the owner can access
create policy "Owner can view own jobs" on public.transcription_jobs for select using (auth.uid() = user_id);
create policy "Owner can insert own jobs" on public.transcription_jobs for insert with check (auth.uid() = user_id);
create policy "Owner can update own jobs" on public.transcription_jobs for update using (auth.uid() = user_id);

-- Usage records: only the owner can access
create policy "Owner can view own usage" on public.usage_records for select using (auth.uid() = user_id);
create policy "Service can insert usage" on public.usage_records for insert with check (true);

-- Function to sync new user creation from auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
