#!/usr/bin/env npx tsx

import postgres from "postgres";
import { z } from "zod";

import {
  CreateExercise,
  CreateVariant,
  CreateWorkout,
  CreateWorkoutCycle,
} from "./create_typedefs";
import { LOCAL_DB_URL } from "./constants";
import { mapAt } from "./util";

const exercises: CreateExercise[] = [
  // Stretch
  {
    name: "lower back stretch",
    description:
      "Lie on your back. Lift one leg up and twist over to one side.",
  },
  {
    name: "crossbody lat stretch",
    description:
      "Lie in a child's pose. Clasp both hands together and twist into one side.",
  },
  {
    name: "lateral hip openers",
    description:
      "In a wide-legged stance, bend from side-to-side, extending your hips.",
  },
  {
    name: "airplanes",
    description:
      "Balanced on one foot, lean your body forward until the other leg is straight back and your arms are extended outwards.",
  },
  // Recover
  {
    name: "recover",
    description: "chill out yo",
  },
  // Core
  {
    name: "high plank",
  },
  {
    name: "isometric bear crawl with shoulder taps",
  },
  {
    name: "oblique twists",
  },
  {
    name: "side plank",
  },
  {
    name: "resistance band tall kneeling pallof press",
  },
  // Upper-body push.
  {
    name: "barbell bench press",
  },
  {
    name: "single-arm dumbbell incline bench press",
  },
  {
    name: "dumbbell front raise",
  },
  {
    name: "tricep dips",
  },
  // Lower-body.
  {
    name: "dumbbell goblet squats",
  },
  {
    name: "stability ball leg curls",
  },
  {
    name: "dumbbell split squats",
  },
  {
    name: "barbell romanian deadlift",
  },
];

const variants: CreateVariant[] = [
  // Convert the following into the form { name: [first tuple item] }. Omit the description field.
  { name: "left side" },
  { name: "right side" },
  { name: "5 second tempo" },
];

const workouts: CreateWorkout[] = [
  {
    name: "upper-body push",
    description: "push push push",
    sets: [
      {
        name: "stretch",
        description: "get stretched",
        reps: 1,
        transition_time: 5,
        exercises: [
          {
            description: "Get some real good flexion on this one yo",
            exercise_name: "lower back stretch",
            variant_name: "left side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "lower back stretch",
            variant_name: "right side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "crossbody lat stretch",
            variant_name: "left side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "crossbody lat stretch",
            variant_name: "right side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 30,
          },
        ],
      },
      {
        name: "core",
        reps: 2,
        exercises: [
          {
            exercise_name: "high plank",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "isometric bear crawl with shoulder taps",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 15,
          },
        ],
      },
      {
        name: "bench",
        reps: 3,
        exercises: [
          {
            exercise_name: "barbell bench press",
            variant_name: "5 second tempo",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 60,
          },
        ],
      },
      {
        name: "accessory",
        reps: 3,
        exercises: [
          {
            exercise_name: "single-arm dumbbell incline bench press",
            variant_name: "left side",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "single-arm dumbbell incline bench press",
            variant_name: "right side",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "dumbbell front raise",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "tricep dips",
            limit_type: "reps",
            limit_value: 15,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 30,
          },
        ],
      },
    ],
  },
  {
    name: "lower-body",
    sets: [
      {
        name: "stretch",
        reps: 1,
        transition_time: 5,
        exercises: [
          {
            exercise_name: "lateral hip openers",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "airplanes",
            variant_name: "left side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "airplanes",
            variant_name: "right side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 30,
          },
        ],
      },
      {
        name: "core",
        reps: 2,
        exercises: [
          {
            exercise_name: "oblique twists",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "side plank",
            variant_name: "left side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "side plank",
            variant_name: "right side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 15,
          },
        ],
      },
      {
        name: "squats",
        reps: 3,
        exercises: [
          {
            exercise_name: "dumbbell goblet squats",
            variant_name: "5 second tempo",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "stability ball leg curls",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 30,
          },
        ],
      },
      {
        name: "accessory",
        reps: 3,
        exercises: [
          {
            exercise_name: "dumbbell split squats",
            variant_name: "left side",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "dumbbell split squats",
            variant_name: "right side",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 45,
          },
          {
            exercise_name: "barbell romanian deadlift",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 60,
          },
        ],
      },
    ],
  },
  {
    name: "stretch it out",
    sets: [
      {
        name: "part 1",
        reps: 1,
        transition_time: 5,
        exercises: [
          {
            exercise_name: "lower back stretch",
            variant_name: "left side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "lower back stretch",
            variant_name: "right side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "crossbody lat stretch",
            variant_name: "left side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "crossbody lat stretch",
            variant_name: "right side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time",
            limit_value: 15,
          },
        ],
      },
      {
        name: "part 2",
        reps: 1,
        transition_time: 5,
        exercises: [
          {
            exercise_name: "lateral hip openers",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "airplanes",
            variant_name: "left side",
            limit_type: "time",
            limit_value: 30,
          },
          {
            exercise_name: "airplanes",
            variant_name: "right side",
            limit_type: "time",
            limit_value: 30,
          },
        ],
      },
    ],
  },
];

const workoutCycles: CreateWorkoutCycle[] = [
  {
    name: "default",
    description: "Your weekday grind",
    user_name: "manu",
    entries: [
      {
        workout_def_name: "upper-body push",
      },
      {
        workout_def_name: "lower-body",
      },
    ],
  },
  {
    name: "nightly stretch",
    user_name: "manu",
    entries: [
      {
        workout_def_name: "stretch it out",
      },
    ],
  },
];

const sql = postgres(LOCAL_DB_URL, {
  transform: {
    undefined: null,
  },
});

async function populateWorkout({
  sql,
  exerciseNameToId,
  variantNameToId,
  workout,
}: {
  sql: postgres.TransactionSql;
  exerciseNameToId: Map<string, string>;
  variantNameToId: Map<string, string>;
  workout: CreateWorkout;
}) {
  const workoutDefId = z.string().parse(
    (
      await sql`
        insert into workout_defs ${sql(
          workout,
          "name",
          "description",
        )} returning id
    `
    )[0].id,
  );

  const augmentedSets = workout.sets.map((s, ordinal) => ({
    ...s,
    workout_def_id: workoutDefId,
    ordinal,
  }));

  const workoutSetResults = z
    .object({ id: z.string(), ordinal: z.number() })
    .array()
    .parse(
      await sql`
        insert into workout_set_defs ${sql(
          augmentedSets,
          "name",
          "description",
          "workout_def_id",
          "ordinal",
          "reps",
          "transition_time",
        )} returning id, ordinal
    `,
    );
  const workoutSetOrdinalToId = new Map<number, string>(
    workoutSetResults.map((x) => [x.ordinal, x.id]),
  );

  const augmentedExercises = workout.sets.flatMap((set, setOrdinal) => {
    return set.exercises.map((exercise, exerciseOrdinal) => ({
      description: exercise.description,
      workout_set_def_id: mapAt(workoutSetOrdinalToId, setOrdinal),
      ordinal: exerciseOrdinal,
      exercise_id: mapAt(exerciseNameToId, exercise.exercise_name),
      variant_id: exercise.variant_name
        ? mapAt(variantNameToId, exercise.variant_name)
        : null,
      limit_type: exercise.limit_type,
      limit_value: exercise.limit_value,
    }));
  });

  await sql`
        insert into workout_set_exercise_defs ${sql(
          augmentedExercises,
          "description",
          "workout_set_def_id",
          "ordinal",
          "exercise_id",
          "variant_id",
          "limit_type",
          "limit_value",
        )}
    `;

  return workoutDefId;
}

async function populateWorkoutCycle({
  sql,
  userNameToId,
  workoutDefNameToId,
  workoutCycle,
}: {
  sql: postgres.TransactionSql;
  userNameToId: Map<string, string>;
  workoutDefNameToId: Map<string, string>;
  workoutCycle: CreateWorkoutCycle;
}) {
  const augmentedCycle = {
    ...workoutCycle,
    user_id: mapAt(userNameToId, workoutCycle.user_name),
  };

  const workoutCycleId = z.string().parse(
    (
      await sql`
        insert into workout_cycles ${sql(
          augmentedCycle,
          "name",
          "description",
          "user_id",
        )} returning id
    `
    )[0].id,
  );

  const augmentedEntries = workoutCycle.entries.map((entry, idx) => ({
    workout_cycle_id: workoutCycleId,
    workout_def_id: mapAt(workoutDefNameToId, entry.workout_def_name),
    ordinal: idx,
  }));

  await sql`
        insert into workout_cycle_entries ${sql(
          augmentedEntries,
          "workout_cycle_id",
          "workout_def_id",
          "ordinal",
        )}
    `;
}

async function populateDb(sql: postgres.TransactionSql) {
  // Check that all the tables are empty. Otherwise we may not be running this
  // on a clean DB.
  const tableNumRows = await sql<{ tbl: string; num_rows: number }[]>`
    select 'exercises' as tbl, count(*) as num_rows from exercises
    union all
    select 'variants' as tbl, count(*) as num_rows from variants
    union all
    select 'workout_defs' as tbl, count(*) as num_rows from workout_defs
  `;

  tableNumRows.forEach((res) => {
    if (Number(res.num_rows) !== 0) {
      throw new Error(`Table ${res.tbl} is not empty`);
    }
  });

  const userName = "manu";
  const userId = z.string().parse(
    (
      await sql`
    select register_user(_name => ${userName}, _password => ${"dogbreath"}) user_id
  `
    )[0].user_id,
  );
  const userNameToId = new Map<string, string>([[userName, userId]]);

  const idNameSchema = z.object({ id: z.string(), name: z.string() });

  const exerciseResults = await sql`
      insert into exercises ${sql(
        exercises,
        "name",
        "description",
      )} returning id, name
  `;
  const exerciseNameToId = new Map<string, string>(
    idNameSchema
      .array()
      .parse(exerciseResults)
      .map((x) => [x.name, x.id]),
  );
  const variantResults = await sql`
      insert into variants ${sql(
        variants,
        "name",
        "description",
      )} returning id, name
  `;
  const variantNameToId = new Map<string, string>(
    idNameSchema
      .array()
      .parse(variantResults)
      .map((x) => [x.name, x.id]),
  );

  const workoutDefNameToId = new Map<string, string>();
  for (const workout of workouts) {
    const workoutDefId = await populateWorkout({
      sql,
      exerciseNameToId,
      variantNameToId,
      workout,
    });
    workoutDefNameToId.set(workout.name, workoutDefId);
  }

  for (const workoutCycle of workoutCycles) {
    await populateWorkoutCycle({
      sql,
      userNameToId,
      workoutDefNameToId,
      workoutCycle,
    });
  }
}

async function main() {
  try {
    await sql.begin(async (sql) => {
      await populateDb(sql);
    });
  } finally {
    await sql.end();
  }
}

main();
