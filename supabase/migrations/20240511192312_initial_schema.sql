create type exercise_limit_type as enum ('reps', 'time');

create table exercises (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    name text not null,
    description text
);

create unique index on exercises (name);

create table variants (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    name text not null,
    description text
);

create unique index on variants (name);

create table workout_defs (
    id uuid not null primary key default gen_random_uuid(),
    created timestamp with time zone not null default current_timestamp,
    name text not null,
    description text
);

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

create unique index on workout_set_exercise_defs (workout_set_def_id, ordinal);

create table workout_instances (
    id uuid not null primary key default gen_random_uuid(),
    username text not null default current_user,
    created timestamp with time zone not null default current_timestamp,
    description text,

    workout_def_id uuid not null references workout_defs,

    started timestamp with time zone,
    finished timestamp with time zone
);

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

create unique index on workout_set_exercise_instances (
    workout_instance_id, workout_set_exercise_def_id, set_rep
);
