-- Delete a workout instance.
create or replace function delete_workout_instance(
    _auth_id uuid,
    _workout_instance_id uuid
)
returns void
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
    _found_workout_instance_id uuid;
begin
-- Make sure the workout instance belongs to this user.
select workout_instances.id into _found_workout_instance_id
from workout_instances
where 
    workout_instances.id = _workout_instance_id
    and workout_instances.user_id = _user_id
;
if not found then
    raise exception 'Workout instance does not exist or you do not have access';
end if;
delete from workout_block_exercise_instances
where workout_instance_id = _workout_instance_id;
delete from workout_instances
where id = _workout_instance_id;
end
$$;

