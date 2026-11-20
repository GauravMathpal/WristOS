-- WristOS Migration 03: Realtime Replication, Voice Preference, and Summary RPC
-- Enables sub-second bi-directional sync and database-level analytics

-- 1. Add tts_enabled column to user_settings
alter table public.user_settings 
add column if not exists tts_enabled boolean default false;

-- 2. Configure Replica Identity for accurate CDC updates and deletes
alter table public.tasks replica identity full;
alter table public.memories replica identity full;
alter table public.focus_sessions replica identity full;
alter table public.activity_logs replica identity full;
alter table public.user_settings replica identity full;

-- 3. Add all tables to supabase_realtime publication
alter publication supabase_realtime add table 
    public.tasks, 
    public.memories, 
    public.focus_sessions, 
    public.activity_logs, 
    public.user_settings;

-- 4. Fast Server-Side Aggregation RPC for Dashboard Summary
create or replace function public.get_user_summary(target_date text default to_char(current_date, 'YYYY-MM-DD'))
returns json
language plpgsql
security definer
as $$
declare
    current_uid uuid := auth.uid();
    total_tasks integer := 0;
    completed_tasks integer := 0;
    total_memories integer := 0;
    focus_minutes integer := 0;
    day_steps integer := 0;
    day_bpm integer := 0;
begin
    if current_uid is null then
        return json_build_object('error', 'unauthorized');
    end if;

    select count(*), count(*) filter (where is_completed = true)
    into total_tasks, completed_tasks
    from public.tasks
    where user_id = current_uid and deleted_at is null;

    select count(*)
    into total_memories
    from public.memories
    where user_id = current_uid and deleted_at is null;

    select coalesce(sum(duration_minutes), 0)
    into focus_minutes
    from public.focus_sessions
    where user_id = current_uid and deleted_at is null;

    select coalesce(steps, 0), coalesce(heart_rate_avg, 72)
    into day_steps, day_bpm
    from public.activity_logs
    where user_id = current_uid and date = target_date and deleted_at is null
    limit 1;

    return json_build_object(
        'totalTasks', coalesce(total_tasks, 0),
        'completedTasks', coalesce(completed_tasks, 0),
        'pendingTasks', coalesce(total_tasks - completed_tasks, 0),
        'totalMemories', coalesce(total_memories, 0),
        'focusMinutes', coalesce(focus_minutes, 0),
        'steps', coalesce(day_steps, 0),
        'heartRateAvg', coalesce(day_bpm, 72)
    );
end;
$$;
