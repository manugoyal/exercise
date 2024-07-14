-- Type definitions.

create type exercise_limit_type as enum ('reps', 'time_s');

-- Table definitions.

create table users (
    id uuid not null primary key default gen_random_uuid(),
    name text not null,
    password_hash text not null,
    auth_id uuid not null default gen_random_uuid()
);

alter table users enable row level security;

create unique index on users (name);
create unique index on users (auth_id);

create table exercises (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    name text not null,
    description text
);

alter table exercises enable row level security;

create unique index on exercises (name);

create table variants (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    name text not null,
    description text
);

alter table variants enable row level security;

create unique index on variants (name);

create table workout_defs (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    user_id uuid not null references users,
    name text not null,
    description text
);

alter table workout_defs enable row level security;

create unique index on workout_defs (user_id, name);

create table workout_block_defs (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    name text,
    description text,

    workout_def_id uuid not null references workout_defs,
    ordinal integer not null,

    sets integer not null,
    check (sets > 0),
    transition_time double precision
);

alter table workout_block_defs enable row level security;

create unique index on workout_block_defs (workout_def_id, ordinal);

create table workout_block_exercise_defs (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    description text,

    workout_block_def_id uuid not null references workout_block_defs,
    ordinal integer not null,

    exercise_id uuid not null references exercises,
    limit_type exercise_limit_type not null,
    limit_value double precision not null
);

alter table workout_block_exercise_defs enable row level security;

create unique index on workout_block_exercise_defs (workout_block_def_id, ordinal);

create table workout_block_exercise_variants (
  workout_block_exercise_def_id uuid not null references workout_block_exercise_defs,
  variant_id uuid not null references variants,
  primary key (workout_block_exercise_def_id, variant_id)
);

alter table workout_block_exercise_defs enable row level security;

create table workout_instances (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    description text,

    workout_def_id uuid not null references workout_defs,
    user_id uuid not null references users,

    started timestamp with time zone,
    finished timestamp with time zone,
    check (not (started is null and finished is not null))
);

alter table workout_instances enable row level security;

create table workout_block_exercise_instances (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    description text,

    workout_instance_id uuid not null references workout_instances,

    workout_block_exercise_def_id uuid not null references workout_block_exercise_defs,
    set_num integer not null,
    check (set_num >= 1),

    weight_lbs double precision not null,
    limit_value integer not null,
    started timestamp with time zone,
    finished timestamp with time zone,
    paused_time_s double precision,
    check (not (started is null and finished is not null)),
    check (not (started is not null and finished is not null and paused_time_s is null)),
    check (paused_time_s is null or paused_time_s >= 0),
    check (
        started is null or
        finished is null or
        paused_time_s is null or
        (paused_time_s <= (extract (epoch from (finished - started)))::double precision)
    )
);

alter table workout_block_exercise_instances enable row level security;

create unique index on workout_block_exercise_instances (
    workout_instance_id, workout_block_exercise_def_id, set_num
);

create table workout_cycles (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    name text not null,
    description text,

    user_id uuid not null references users
);

alter table workout_cycles enable row level security;

create unique index on workout_cycles (user_id, name);

create table workout_cycle_entries (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,

    workout_cycle_id uuid not null references workout_cycles,
    workout_def_id uuid not null references workout_defs,
    ordinal integer not null
);

alter table workout_cycle_entries enable row level security;

create unique index on workout_cycle_entries (workout_cycle_id, ordinal);

-- Function definitions.

create or replace function register_user(
    _name text,
    _password text
)
returns uuid
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid;
begin
    insert into users (name, password_hash)
    values (_name, extensions.crypt(_password, extensions.gen_salt('bf')))
    returning id into _user_id;

    return _user_id;
end;
$$;

revoke execute on function register_user from public, anon, authenticated, service_role;

create or replace function lookup_auth_id(
    _name text,
    _password text
)
returns uuid
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _auth_id uuid;
begin
    select auth_id into _auth_id
    from users
    where
        name = _name
        and password_hash = extensions.crypt(_password, password_hash)
    ;
    if not found then
        raise exception 'Username and password combination not found';
    end if;
    return _auth_id;
end;
$$;

create or replace function lookup_user_id(_auth_id uuid)
returns uuid
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid;
begin
    select id into _user_id
    from users
    where auth_id = _auth_id;

    if not found then
        raise exception 'auth_id not found';
    end if;

    return _user_id;
end;
$$;

create or replace function get_workout_block_exercise_variants_key(
    _workout_block_exercise_def_id uuid
)
returns text
language sql
security definer set search_path = 'public'
as $$
select coalesce(string_agg(variant_id::text, ',' order by variant_id), '')
from workout_block_exercise_variants
where workout_block_exercise_def_id = _workout_block_exercise_def_id
$$;

revoke execute on function get_workout_block_exercise_variants_key from public, anon, authenticated, service_role;

-- Returns UserSchema.
create or replace function get_user(_auth_id uuid)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
    return (
        select jsonb_build_object('id', users.id, 'name', users.name)
        from users
        where id = _user_id
    );
end;
$$;

-- Returns WorkoutDefDenormalized.
create or replace function get_workout_def(_auth_id uuid, _id uuid)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
return (
    with
    block_exercise_variants as (
    select
        workout_block_exercise_defs.id workout_block_exercise_def_id,
        array_agg(to_jsonb(variants) order by variants.name) variants
    from
        workout_block_defs
            join workout_block_exercise_defs on (
                workout_block_defs.id =
                    workout_block_exercise_defs.workout_block_def_id
            )
            join workout_block_exercise_variants on (
                workout_block_exercise_defs.id =
                    workout_block_exercise_variants.workout_block_exercise_def_id
            )
            join variants on (
                workout_block_exercise_variants.variant_id = variants.id
            )
    where
        workout_block_defs.workout_def_id = _id
    group by
        workout_block_exercise_defs.id
    ),
    block_exercises as (
    select
        workout_block_defs.id,
        coalesce(jsonb_agg(
            (
                (to_jsonb(workout_block_exercise_defs) - ARRAY['workout_block_def_id', 'ordinal', 'exercise_id']) ||
                jsonb_build_object(
                    'exercise', to_jsonb(exercises),
                    'variants', coalesce(to_jsonb(block_exercise_variants.variants), '[]'::jsonb)
                )
            ) order by workout_block_exercise_defs.ordinal), '[]'::jsonb) exercises
    from
        workout_block_defs
            join workout_block_exercise_defs on workout_block_defs.id = workout_block_exercise_defs.workout_block_def_id
            join exercises on exercises.id = workout_block_exercise_defs.exercise_id
            left join block_exercise_variants on (
                workout_block_exercise_defs.id =
                    block_exercise_variants.workout_block_exercise_def_id
            )
    where
        workout_block_defs.workout_def_id = _id
    group by
        workout_block_defs.id
    ),
    blocks as (
    select
        coalesce(jsonb_agg(
            (
                (to_jsonb(workout_block_defs) - ARRAY['workout_def_id', 'ordinal'])
                || jsonb_build_object('exercises', block_exercises.exercises)
            ) order by workout_block_defs.ordinal), '[]'::jsonb) blocks
    from
        workout_block_defs join block_exercises using (id)
    )
    select (to_jsonb(workout_defs) - ARRAY ['user_id']) || jsonb_build_object(
        'user', get_user(_auth_id),
        'blocks', blocks,
        'last_finished', (
            select workout_instances.finished
            from workout_instances
            where
                workout_instances.workout_def_id = workout_defs.id
                and workout_instances.user_id = _user_id
                and workout_instances.finished is not null
            order by finished desc
            limit 1
        )
    )
    from workout_defs join blocks on true
    where workout_defs.id = _id
);
end;
$$;

-- Returns WorkoutInstanceDenormalized.
create or replace function get_workout_instance(_auth_id uuid, _id uuid)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
return (
    with
    block_exercises as (
    select
        coalesce(jsonb_agg(
            (to_jsonb(workout_block_exercise_instances) - ARRAY['workout_instance_id'])
            order by workout_block_exercise_instances.id
        ), '[]'::jsonb) vals
    from workout_block_exercise_instances
    where workout_block_exercise_instances.workout_instance_id = _id
    )
    select
        (to_jsonb(workout_instances) - ARRAY['workout_def_id', 'user_id'])
        || jsonb_build_object(
            'workout_def', get_workout_def(_auth_id, workout_instances.workout_def_id),
            'user', get_user(_auth_id),
            'block_exercises', block_exercises.vals)
    from workout_instances join block_exercises on true
    where workout_instances.id = _id
);
end;
$$;

-- Returns WorkoutCycleDenormalized.
create or replace function get_workout_cycle(_auth_id uuid, _id uuid)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
return (
    with
    cycle_entries as (
    select
        coalesce(jsonb_agg(
            ((to_jsonb(workout_cycle_entries) - ARRAY['workout_cycle_id', 'workout_def_id', 'ordinal']) ||
             jsonb_build_object('workout_def', get_workout_def(_auth_id, workout_cycle_entries.workout_def_id)))
            order by workout_cycle_entries.ordinal), '[]'::jsonb) vals
    from
        workout_cycle_entries where workout_cycle_id = _id
    )
    select
        (to_jsonb(workout_cycles) - ARRAY['user_id']) ||
        jsonb_build_object(
            'user', get_user(_auth_id),
            'entries', cycle_entries.vals
        )
    from workout_cycles join cycle_entries on true
    where workout_cycles.id = _id
);
end;
$$;

-- Returns WorkoutCycleDenormalized[]
create or replace function get_workout_cycles(_auth_id uuid)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
return (
    select jsonb_agg(
        get_workout_cycle(_auth_id, workout_cycles.id)
        order by workout_cycles.id)
    from workout_cycles
    where user_id = _user_id
);
end
$$;

-- Instantiate a new workout instance from a workout def. Fills out initial
-- values for all exercises in all sets of each block. Returns the newly-created
-- WorkoutInstanceDenormalized.
create or replace function instantiate_workout(_auth_id uuid, _workout_def_id uuid)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
    _workout_instance_id uuid;
begin
-- Create the workout_instance entry.
insert into workout_instances (workout_def_id, user_id)
values (_workout_def_id, _user_id)
returning id into _workout_instance_id;
-- Initialize workout_block_exercise_instances entries for every (block,
-- set_num) in the workout.
--
-- Try to use the weights from the last matching workout instance. If
-- unavailable, use weights from the last matching instance on the same
-- (exercise_id, variant_id). If that too is unavailable, set it to 0.
--
-- Grab the limit values from the workout_block_exercise_defs themselves.
with
last_matching_workout_instance as (
    select id from workout_instances
    where
        workout_def_id = _workout_def_id and user_id = _user_id
        and finished is not null
    order by finished desc
    limit 1
),
last_matching_workout_block_exercise_instances as (
    select workout_block_exercise_instances.*
    from
        workout_block_exercise_instances
        join last_matching_workout_instance on (
            workout_block_exercise_instances.workout_instance_id =
                last_matching_workout_instance.id
        )
),
last_matching_exercise_variant_instances as (
    select distinct on (exercise_id, variants_key)
        workout_block_exercise_defs.exercise_id,
        get_workout_block_exercise_variants_key(workout_block_exercise_defs.id) variants_key,
        workout_block_exercise_instances.weight_lbs
    from
        workout_block_exercise_instances
        join workout_instances on (
            workout_block_exercise_instances.workout_instance_id =
                workout_instances.id
        )
        join workout_block_exercise_defs on (
            workout_block_exercise_instances.workout_block_exercise_def_id =
                workout_block_exercise_defs.id
        )
    where
        workout_instances.user_id = _user_id
        and workout_block_exercise_instances.finished is not null
    order by
        exercise_id,
        variants_key,
        workout_block_exercise_instances.finished desc
),
prefilled_instances as (
    select
        _workout_instance_id workout_instance_id,
        workout_block_exercise_defs.id workout_block_exercise_def_id,
        set_num_value set_num,
        coalesce(
            last_matching_workout_block_exercise_instances.weight_lbs,
            last_matching_exercise_variant_instances.weight_lbs,
            0
        ) weight_lbs,
        workout_block_exercise_defs.limit_value
    from
        workout_block_defs 
        cross join generate_series(1, workout_block_defs.sets) set_num_value
        join workout_block_exercise_defs on (
            workout_block_exercise_defs.workout_block_def_id =
                workout_block_defs.id
        )
        left join last_matching_workout_block_exercise_instances on (
            last_matching_workout_block_exercise_instances.workout_block_exercise_def_id =
                workout_block_exercise_defs.id
        )
        left join last_matching_exercise_variant_instances on (
            last_matching_exercise_variant_instances.exercise_id =
                workout_block_exercise_defs.exercise_id
            and last_matching_exercise_variant_instances.variants_key =
                get_workout_block_exercise_variants_key(workout_block_exercise_defs.id)
        )
)
insert into workout_block_exercise_instances (
    workout_instance_id, workout_block_exercise_def_id, set_num, weight_lbs,
    limit_value)
select * from prefilled_instances
;
-- Return the full, denormalized workout instance.
return (select get_workout_instance(_auth_id, _workout_instance_id));
end
$$;

-- Patch a workout_instance object. Does not support setting a value to null.
create or replace function patch_workout_instance(
    _auth_id uuid,
    _workout_instance_id uuid,
    _description text default null,
    _started timestamp default null,
    _finished timestamp default null,
    _set_finished_to_null boolean default null
)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
-- Make sure the workout instance exists and belongs to this user.
perform 1 from workout_instances
where id = _workout_instance_id and user_id = _user_id;
if not found then
    raise exception 'Workout instance does not exist or you do not have access';
end if;
-- Update the values of this row.
update workout_instances
set
    description = coalesce(_description, description),
    started = coalesce(_started, started),
    finished = case when _set_finished_to_null then null else coalesce(_finished, finished) end
where id = _workout_instance_id
;
-- Return the full, denormalized workout instance.
return (select get_workout_instance(_auth_id, _workout_instance_id));
end
$$;

-- Patch a workout_block_exercise_instance object. Does not support setting a
-- value to null.
create or replace function patch_workout_block_exercise_instance(
    _auth_id uuid,
    _workout_block_exercise_instance_id uuid,
    _description text default null,
    _weight_lbs double precision default null,
    _limit_value double precision default null,
    _started timestamp default null,
    _finished timestamp default null,
    _paused_time_s double precision default null
)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
    _workout_instance_id uuid;
begin
-- Make sure the workout set exercise instance exists and belongs to this user.
select workout_instances.id into _workout_instance_id
from
    workout_block_exercise_instances
    join workout_instances on (
        workout_block_exercise_instances.workout_instance_id =
            workout_instances.id
    )
where
    workout_block_exercise_instances.id = _workout_block_exercise_instance_id
    and workout_instances.user_id = _user_id
;
if not found then
    raise exception 'Workout set exercise instance does not exist or you do not have access';
end if;
-- Update the values of this row.
update workout_block_exercise_instances
set
    description = coalesce(_description, description),
    weight_lbs = coalesce(_weight_lbs, weight_lbs),
    limit_value = coalesce(_limit_value, limit_value),
    started = coalesce(_started, started),
    finished = coalesce(_finished, finished),
    paused_time_s = coalesce(_paused_time_s, paused_time_s)
where id = _workout_block_exercise_instance_id
;
-- Return the full, denormalized workout instance.
return (select get_workout_instance(_auth_id, _workout_instance_id));
end
$$;

-- Returns PastWorkoutInstance[].
create or replace function get_past_workout_instances(_auth_id uuid, _limit integer)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
    return (
        with rows_to_return as (
            select
                workout_instances.*,
                workout_defs.name workout_def_name,
                workout_defs.description workout_def_description
            from
                workout_instances
                join workout_defs on (
                    workout_instances.workout_def_id = workout_defs.id
                )
            where workout_instances.user_id = _user_id
            order by workout_instances.created desc
            limit _limit
        )
        select coalesce(jsonb_agg(to_jsonb(rows_to_return) order by rows_to_return.id), '[]'::jsonb) from rows_to_return
    );
end
$$;

-- Returns { "def": WorkoutBlockExerciseDef,
-- "instance": WorkoutBlockExerciseInstance }[]
create or replace function get_exercise_history(_auth_id uuid, _workout_block_exercise_instance_id uuid)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
    return (
        with
        found_instance as (
            select *
            from workout_block_exercise_instances
            where id = _workout_block_exercise_instance_id
        ),
        found_def as (
            select *
            from workout_block_exercise_defs
            where id in (select workout_block_exercise_def_id from found_instance)
        ),
        matching_instances as (
            select workout_block_exercise_instances.*
            from
                workout_block_exercise_instances
                join workout_instances on (
                    workout_block_exercise_instances.workout_instance_id = workout_instances.id
                )
                join workout_block_exercise_defs on (
                    workout_block_exercise_defs.id =
                        workout_block_exercise_instances.workout_block_exercise_def_id
                )
            where
                workout_instances.user_id = _user_id
                and workout_block_exercise_instances.finished is not null
                and workout_block_exercise_defs.exercise_id in (select exercise_id from found_def)
                and get_workout_block_exercise_variants_key(workout_block_exercise_defs.id) in (
                    select get_workout_block_exercise_variants_key(id) from found_def
                )
        )
        select
            coalesce(jsonb_agg(jsonb_build_object(
                'def', to_jsonb(workout_block_exercise_defs),
                'instance', to_jsonb(matching_instances))), '[]'::jsonb)
        from
            matching_instances
            join workout_block_exercise_defs on (
                workout_block_exercise_defs.id = matching_instances.workout_block_exercise_def_id
            )
    );
end
$$;
