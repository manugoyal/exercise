-- Deletes all user data in the database.
create or replace function delete_all_user_data(_auth_id uuid)
returns void
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
-- Delete workout cycles.
perform (
    with workout_cycle_ids as (
        select array_agg(workout_cycles.id) ids from workout_cycles
        where workout_cycles.user_id = _user_id
    )
    select delete_workout_cycles(_auth_id, workout_cycle_ids.ids)
    from workout_cycle_ids
);
-- Delete workout defs.
perform (
    with workout_def_ids as (
        select array_agg(workout_defs.id) ids from workout_defs
        where workout_defs.user_id = _user_id
    )
    select delete_workout_defs(_auth_id, workout_def_ids.ids)
    from workout_def_ids
);
end;
$$;
