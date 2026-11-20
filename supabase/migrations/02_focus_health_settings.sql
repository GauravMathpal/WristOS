-- WristOS Schema Migration 02: Focus Sessions, Activity Logs, and User Settings
-- Enables full bi-directional synchronization with Dexie.js local database

-- 1. FOCUS SESSIONS TABLE
create table if not exists public.focus_sessions (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    duration_minutes integer not null default 25,
    mode text default 'pomodoro',
    completed_at text not null,
    created_at bigint not null,
    updated_at bigint not null,
    deleted_at bigint default null
);

create index if not exists idx_focus_sessions_user_id on public.focus_sessions(user_id);
create index if not exists idx_focus_sessions_updated_at on public.focus_sessions(updated_at);
create index if not exists idx_focus_sessions_deleted_at on public.focus_sessions(deleted_at);

-- 2. ACTIVITY LOGS TABLE (Health & Biometrics)
create table if not exists public.activity_logs (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    date text not null,
    steps integer default 0,
    step_goal integer default 10000,
    heart_rate_avg integer default 0,
    calories integer default 0,
    distance_km numeric(5,2) default 0.0,
    active_minutes integer default 0,
    created_at bigint not null,
    updated_at bigint not null,
    deleted_at bigint default null
);

create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_date on public.activity_logs(date);
create index if not exists idx_activity_logs_updated_at on public.activity_logs(updated_at);
create index if not exists idx_activity_logs_deleted_at on public.activity_logs(deleted_at);

-- 3. USER SETTINGS TABLE (Themes & Hardware Preferences)
create table if not exists public.user_settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    preset text default 'aurora',
    mode text default 'dark',
    custom_primary text default '#A855F7',
    custom_secondary text default '#EC4899',
    auto_sync boolean default true,
    notifications boolean default true,
    wrist_vibrate boolean default true,
    updated_at bigint not null
);

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.focus_sessions enable row level security;
alter table public.activity_logs enable row level security;
alter table public.user_settings enable row level security;

-- Focus Sessions RLS
create policy "Users can view own focus sessions"
    on public.focus_sessions for select
    using (auth.uid() = user_id);

create policy "Users can insert own focus sessions"
    on public.focus_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update own focus sessions"
    on public.focus_sessions for update
    using (auth.uid() = user_id);

create policy "Users can delete own focus sessions"
    on public.focus_sessions for delete
    using (auth.uid() = user_id);

-- Activity Logs RLS
create policy "Users can view own activity logs"
    on public.activity_logs for select
    using (auth.uid() = user_id);

create policy "Users can insert own activity logs"
    on public.activity_logs for insert
    with check (auth.uid() = user_id);

create policy "Users can update own activity logs"
    on public.activity_logs for update
    using (auth.uid() = user_id);

create policy "Users can delete own activity logs"
    on public.activity_logs for delete
    using (auth.uid() = user_id);

-- User Settings RLS
create policy "Users can view own settings"
    on public.user_settings for select
    using (auth.uid() = user_id);

create policy "Users can insert own settings"
    on public.user_settings for insert
    with check (auth.uid() = user_id);

create policy "Users can update own settings"
    on public.user_settings for update
    using (auth.uid() = user_id);

create policy "Users can delete own settings"
    on public.user_settings for delete
    using (auth.uid() = user_id);
