-- Type definitions.

create type exercise_limit_type as enum ('reps', 'time');

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
    name text not null,
    description text
);

alter table workout_defs enable row level security;

create unique index on workout_defs (name);

create table workout_set_defs (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    name text,
    description text,

    workout_def_id uuid not null references workout_defs,
    ordinal integer not null,

    reps integer not null,
    check (reps > 0),
    transition_time real
);

alter table workout_set_defs enable row level security;

create unique index on workout_set_defs (workout_def_id, ordinal);

create table workout_set_exercise_defs (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    description text,

    workout_set_def_id uuid not null references workout_set_defs,
    ordinal integer not null,

    exercise_id uuid not null references exercises,
    variant_id uuid references variants,
    limit_type exercise_limit_type not null,
    limit_value real not null
);

alter table workout_set_exercise_defs enable row level security;

create unique index on workout_set_exercise_defs (workout_set_def_id, ordinal);

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

create table workout_set_exercise_instances (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    description text,

    workout_instance_id uuid not null references workout_instances,

    workout_set_exercise_def_id uuid not null references workout_set_exercise_defs,
    set_rep integer not null,
    check (set_rep >= 0),

    weight real,
    limit_value integer not null,
    started timestamp with time zone,
    finished timestamp with time zone,
    check (not (started is null and finished is not null))
);

alter table workout_set_exercise_instances enable row level security;

create unique index on workout_set_exercise_instances (
    workout_instance_id, workout_set_exercise_def_id, set_rep
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
    set_exercises as (
    select
        workout_set_defs.id,
        coalesce(jsonb_agg(
            (
                (to_jsonb(workout_set_exercise_defs) - ARRAY['workout_set_def_id', 'ordinal', 'exercise_id', 'variant_id']) ||
                jsonb_build_object('exercise', to_jsonb(exercises), 'variant', to_jsonb(variants))
            ) order by workout_set_exercise_defs.ordinal), '[]'::jsonb) exercises
    from
        workout_set_defs
            join workout_set_exercise_defs on workout_set_defs.id = workout_set_exercise_defs.workout_set_def_id
            join exercises on exercises.id = workout_set_exercise_defs.exercise_id
            left join variants on variants.id = workout_set_exercise_defs.variant_id
    where
        workout_set_defs.workout_def_id = _id
    group by
        workout_set_defs.id
    ),
    sets as (
    select
        coalesce(jsonb_agg(
            (
                (to_jsonb(workout_set_defs) - ARRAY['workout_def_id', 'ordinal'])
                || jsonb_build_object('exercises', set_exercises.exercises)
            ) order by workout_set_defs.ordinal), '[]'::jsonb) sets
    from
        workout_set_defs join set_exercises using (id)
    )
    select to_jsonb(workout_defs) || jsonb_build_object('sets', sets)
    from workout_defs join sets on true
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
    exercise_instances as (
    select
        coalesce(jsonb_agg(
            (to_jsonb(workout_set_exercise_instances) - ARRAY['workout_instance_id'])
            order by workout_set_exercise_instances.created, workout_set_exercise_instances.id
        ), '[]'::jsonb) vals
    from workout_set_exercise_instances
    where workout_set_exercise_instances.workout_instance_id = _id
    )
    select
        (to_jsonb(workout_instances) - ARRAY['workout_def_id', 'user_id'])
        || jsonb_build_object(
            'workout_def', get_workout_def(_auth_id, workout_instances.workout_def_id),
            'user', get_user(_auth_id),
            'set_exercises', exercise_instances.vals)
    from workout_instances join exercise_instances on true
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
            (
                (to_jsonb(workout_cycle_entries) - ARRAY['workout_cycle_id', 'workout_def_id', 'ordinal']) ||
                jsonb_build_object(
                    'workout_def', get_workout_def(_auth_id, workout_cycle_entries.workout_def_id),
                    'last_finished', (
                        select workout_instances.finished
                        from workout_instances
                        where
                            workout_instances.workout_def_id = workout_cycle_entries.workout_def_id
                            and workout_instances.user_id = _user_id
                            and workout_instances.finished is not null
                        order by finished desc
                        limit 1
                    )
                )
            ) order by workout_cycle_entries.ordinal), '[]'::jsonb) vals
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
        order by workout_cycles.created)
    from workout_cycles
    where user_id = _user_id
);
end
$$;
