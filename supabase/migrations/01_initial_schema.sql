-- WristOS Schema: Tasks, Memories, and Sync Metadata
-- Compatible with local-first Dexie.js schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. TASKS TABLE
create table if not exists public.tasks (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text default '',
    due_time text default 'Today',
    is_completed boolean default false not null,
    priority text default 'normal',
    category text default 'general',
    created_at bigint not null,
    updated_at bigint not null,
    deleted_at bigint default null
);

-- Indexes for performance
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_updated_at on public.tasks(updated_at);
create index if not exists idx_tasks_deleted_at on public.tasks(deleted_at);

-- 2. MEMORIES TABLE
create table if not exists public.memories (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    tag text not null,
    fact text not null,
    created_at bigint not null,
    updated_at bigint not null,
    deleted_at bigint default null
);

-- Indexes for performance
create index if not exists idx_memories_user_id on public.memories(user_id);
create index if not exists idx_memories_updated_at on public.memories(updated_at);
create index if not exists idx_memories_deleted_at on public.memories(deleted_at);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.tasks enable row level security;
alter table public.memories enable row level security;

-- Tasks RLS: Users can only select, insert, update, or delete their own rows
create policy "Users can view own tasks"
    on public.tasks for select
    using (auth.uid() = user_id);

create policy "Users can insert own tasks"
    on public.tasks for insert
    with check (auth.uid() = user_id);

create policy "Users can update own tasks"
    on public.tasks for update
    using (auth.uid() = user_id);

create policy "Users can delete own tasks"
    on public.tasks for delete
    using (auth.uid() = user_id);

-- Memories RLS: Users can only select, insert, update, or delete their own rows
create policy "Users can view own memories"
    on public.memories for select
    using (auth.uid() = user_id);

create policy "Users can insert own memories"
    on public.memories for insert
    with check (auth.uid() = user_id);

create policy "Users can update own memories"
    on public.memories for update
    using (auth.uid() = user_id);

create policy "Users can delete own memories"
    on public.memories for delete
    using (auth.uid() = user_id);
