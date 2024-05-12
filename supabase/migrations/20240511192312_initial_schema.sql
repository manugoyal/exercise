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
    finished timestamp with time zone
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
    finished timestamp with time zone
);

alter table workout_set_exercise_instances enable row level security;

create unique index on workout_set_exercise_instances (
    workout_instance_id, workout_set_exercise_def_id, set_rep
);

-- Function definitions.

create function register_user(
    _name text,
    _password text
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
    _user_id uuid;
begin
    insert into public.users (name, password)
    values (_name, extensions.crypt(_password, extensions.gen_salt('bf')))
    returning id into _user_id;

    return _user_id;
end;
$$;

revoke execute on function register_user from public, anon, authenticated, service_role;

create function lookup_auth_id(
    _name text,
    _password text
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
    _auth_id uuid;
begin
    select auth_id into _auth_id
    from public.users
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

create function lookup_user_id(_auth_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
    _user_id uuid;
begin
    select id into _user_id
    from public.users
    where auth_id = _auth_id;

    if not found then
        raise exception 'auth_id not found';
    end if;

    return _user_id;
end;
$$;
