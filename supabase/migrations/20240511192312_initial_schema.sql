-- Type definitions.

create type exercise_limit_type as enum ('reps', 'time');

-- Table definitions.

create table users (
    id uuid not null primary key default gen_random_uuid(),
    name text not null,
    password text not null,
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

create function register_user(
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
    insert into users (name, password)
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
        and password = extensions.crypt(_password, password)
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

-- See app/src/WorkoutCyclesPicker.tsx for schema.
create or replace function get_workout_cycles(_auth_id uuid)
returns jsonb
language plpgsql
security definer set search_path = 'public'
as $$
declare
    _user_id uuid := lookup_user_id(_auth_id);
begin
return (
    with
    workout_cycles_and_entries as (
    select
        workout_cycles.id workout_cycle_id,
        workout_cycles.name workout_cycle_name,
        workout_cycles.description workout_cycle_description,
        workout_cycle_entries.ordinal workout_entry_ordinal,
        workout_defs.id workout_def_id,
        workout_defs.name workout_def_name,
        workout_defs.description workout_def_description,
        (
            select workout_instances.finished
            from workout_instances
            where
                workout_instances.workout_def_id = workout_cycle_entries.workout_def_id
                and workout_instances.user_id = _user_id
                and workout_instances.finished is not null
            order by finished desc
            limit 1
        ) workout_entry_last_finished
    from
        workout_cycles
            join workout_cycle_entries on workout_cycles.id = workout_cycle_entries.workout_cycle_id
            join workout_defs on workout_cycle_entries.workout_def_id = workout_defs.id
    where
        workout_cycles.user_id = _user_id 
    ),
    grouped_cycles as (
    select
        workout_cycle_id,
        workout_cycle_name,
        workout_cycle_description,
        jsonb_agg(jsonb_build_object(
            'ordinal', workout_entry_ordinal,
            'workout_def_id', workout_def_id,
            'name', workout_def_name,
            'description', workout_def_description,
            'last_finished', workout_entry_last_finished)) workout_cycle_entries
    from workout_cycles_and_entries
    group by workout_cycle_id, workout_cycle_name, workout_cycle_description
    )
    select jsonb_agg(jsonb_build_object(
            'id', workout_cycle_id,
            'name', workout_cycle_name,
            'description', workout_cycle_description,
            'entries', workout_cycle_entries))
    from grouped_cycles
);
end;
$$;
