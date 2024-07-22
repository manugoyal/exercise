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

const userName = "manu";

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
  {
    name: "internal side stretch",
    description:
      "Stand with one leg ahead of the other. Bend down and try to touch your hands to the floor between your legs.",
  },
  {
    name: "head to knee",
    description:
      "Sitting on the ground, stick one leg out and pretzel the other leg against it. Stretch your body forward and try to touch the outstretched leg with your hands and your head to your knee.",
  },
  {
    name: "single leg knee tuck",
    description: "Lying flat on your back, tuck one knee into your chest.",
  },
  {
    name: "both legs knee tuck",
    description: "Lying flat on your back, tuck both knees into your chest.",
  },
  {
    name: "bent-over tricep stretch",
    description:
      "Stretch out your chest and clasp your hands behind your back. Bend over.",
  },
  {
    name: "seated forward fold",
    description:
      "Sitting on the ground, stick both legs out and bend forward, trying to touch your feet with your hands and your knees with your head.",
  },
  {
    name: "spiderman stretch",
    description:
      "Start in a high plank position. Alternating legs, bring one up to align with your arms/shoulder, and then bring it back.",
  },
  {
    name: "equestrian",
    description:
      "With one foot planted on the ground, stick the other one back lying on the ground. Bend forward and support yourself lightly with your hands.",
  },
  {
    name: "figure-four stretch",
    description:
      "Lying on your back, bend one leg up into a 90 degree angle. Lift up your other leg and place the foot of the bent leg against the knee of the lifted one. Pull back on the lifted leg to stretch the bent one.",
  },
  {
    name: "pigeon pose",
    description:
      "Sit on the ground with one leg stuck back lying on the ground and the other leg bent obtuse and tucked into your torso. Sit back.",
  },
  {
    name: "cat camel",
    description:
      "Bent over with both knees and both hands on the ground, alternate between arching the back and pointing upwards (cat) and arching the back and pointing downwards (camel).",
  },
  {
    name: "bicep and back stretch",
    description:
      "Inverse of bent-over tricep stretch: connect your two hands and stretch them in front of your torso, bending backwards slightly.",
  },
  // Recover
  {
    name: "recover",
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
  { name: "4 second tempo" },
];

const workouts: CreateWorkout[] = [
  {
    name: "upper-body push",
    description: "push push push",
    user_name: userName,
    blocks: [
      {
        name: "stretch",
        description: "get stretched",
        sets: 1,
        transition_time: 5,
        exercises: [
          {
            description: "Get some real good flexion on this one yo",
            exercise_name: "lower back stretch",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "lower back stretch",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "crossbody lat stretch",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "crossbody lat stretch",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 30,
          },
        ],
      },
      {
        name: "core",
        sets: 2,
        exercises: [
          {
            exercise_name: "high plank",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "isometric bear crawl with shoulder taps",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 15,
          },
        ],
      },
      {
        name: "bench",
        sets: 3,
        exercises: [
          {
            exercise_name: "barbell bench press",
            variant_names: ["5 second tempo"],
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 60,
          },
        ],
      },
      {
        name: "accessory",
        sets: 3,
        exercises: [
          {
            exercise_name: "single-arm dumbbell incline bench press",
            variant_names: ["left side", "4 second tempo"],
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "single-arm dumbbell incline bench press",
            variant_names: ["right side", "4 second tempo"],
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "dumbbell front raise",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "tricep dips",
            limit_type: "reps",
            limit_value: 15,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 30,
          },
        ],
      },
    ],
  },
  {
    name: "lower-body",
    user_name: userName,
    blocks: [
      {
        name: "stretch",
        sets: 1,
        transition_time: 5,
        exercises: [
          {
            exercise_name: "lateral hip openers",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "airplanes",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "airplanes",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 30,
          },
        ],
      },
      {
        name: "core",
        sets: 2,
        exercises: [
          {
            exercise_name: "oblique twists",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "side plank",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "side plank",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 15,
          },
        ],
      },
      {
        name: "squats",
        sets: 3,
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
            limit_type: "time_s",
            limit_value: 30,
          },
        ],
      },
      {
        name: "accessory",
        sets: 3,
        exercises: [
          {
            exercise_name: "dumbbell split squats",
            variant_names: ["left side"],
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "dumbbell split squats",
            variant_names: ["right side"],
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 45,
          },
          {
            exercise_name: "barbell romanian deadlift",
            limit_type: "reps",
            limit_value: 8,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 60,
          },
        ],
      },
    ],
  },
  {
    name: "nightly stretch",
    user_name: userName,
    blocks: [
      {
        name: "part 1",
        sets: 1,
        transition_time: 5,
        exercises: [
          {
            exercise_name: "internal side stretch",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "internal side stretch",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "lower back stretch",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "lower back stretch",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "head to knee",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "head to knee",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "single leg knee tuck",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 15,
          },
          {
            exercise_name: "single leg knee tuck",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 15,
          },
          {
            exercise_name: "both legs knee tuck",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "bent-over tricep stretch",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "recover",
            limit_type: "time_s",
            limit_value: 15,
          },
        ],
      },
      {
        name: "part 2",
        sets: 1,
        transition_time: 5,
        exercises: [
          {
            exercise_name: "seated forward fold",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "spiderman stretch",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "equestrian",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 15,
          },
          {
            exercise_name: "equestrian",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 15,
          },
          {
            exercise_name: "figure-four stretch",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "figure-four stretch",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "pigeon pose",
            variant_names: ["left side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "pigeon pose",
            variant_names: ["right side"],
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "cat camel",
            limit_type: "time_s",
            limit_value: 30,
          },
          {
            exercise_name: "bicep and back stretch",
            limit_type: "time_s",
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
    user_name: userName,
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
    name: "stretch",
    user_name: "manu",
    entries: [
      {
        workout_def_name: "nightly stretch",
      },
    ],
  },
];

async function populateWorkout({
  sql,
  userNameToId,
  exerciseNameToId,
  variantNameToId,
  workout,
}: {
  sql: postgres.TransactionSql;
  userNameToId: Map<string, string>;
  exerciseNameToId: Map<string, string>;
  variantNameToId: Map<string, string>;
  workout: CreateWorkout;
}) {
  const augmentedWorkout = {
    ...workout,
    user_id: mapAt(userNameToId, workout.user_name),
  };
  const workoutDefId = z.string().parse(
    (
      await sql`
        insert into workout_defs ${sql(
          augmentedWorkout,
          "user_id",
          "name",
          "description",
        )} returning id
    `
    )[0].id,
  );

  const augmentedBlocks = workout.blocks.map((s, ordinal) => ({
    ...s,
    workout_def_id: workoutDefId,
    ordinal,
  }));

  const workoutBlockResults = z
    .object({ id: z.string(), ordinal: z.number() })
    .array()
    .parse(
      await sql`
        insert into workout_block_defs ${sql(
          augmentedBlocks,
          "name",
          "description",
          "workout_def_id",
          "ordinal",
          "sets",
          "transition_time",
        )} returning id, ordinal
    `,
    );
  const workoutBlockOrdinalToId = new Map<number, string>(
    workoutBlockResults.map((x) => [x.ordinal, x.id]),
  );

  const augmentedExercises = workout.blocks.flatMap((block, setOrdinal) => {
    return block.exercises.map((exercise, exerciseOrdinal) => ({
      description: exercise.description,
      workout_block_def_id: mapAt(workoutBlockOrdinalToId, setOrdinal),
      ordinal: exerciseOrdinal,
      exercise_id: mapAt(exerciseNameToId, exercise.exercise_name),
      variant_ids: exercise.variant_names
        ? exercise.variant_names.map((name) => mapAt(variantNameToId, name))
        : null,
      limit_type: exercise.limit_type,
      limit_value: exercise.limit_value,
    }));
  });

  const workoutBlockExerciseDefResults = z
    .object({
      id: z.string(),
      workout_block_def_id: z.string(),
      ordinal: z.number(),
    })
    .array()
    .parse(
      await sql`
        insert into workout_block_exercise_defs ${sql(
          augmentedExercises,
          "description",
          "workout_block_def_id",
          "ordinal",
          "exercise_id",
          "limit_type",
          "limit_value",
        )} returning id, workout_block_def_id, ordinal
    `,
    );
  const workoutBlockExerciseInfoToId = new Map<string, string>(
    workoutBlockExerciseDefResults.map((x) => [
      JSON.stringify([x.workout_block_def_id, x.ordinal]),
      x.id,
    ]),
  );

  const workoutBlockExerciseVariantDatas = augmentedExercises.flatMap((x) =>
    (x.variant_ids ?? []).map((variant_id) => ({
      workout_block_exercise_def_id: mapAt(
        workoutBlockExerciseInfoToId,
        JSON.stringify([x.workout_block_def_id, x.ordinal]),
      ),
      variant_id,
    })),
  );

  await sql`
        insert into workout_block_exercise_variants ${sql(
          workoutBlockExerciseVariantDatas,
          "workout_block_exercise_def_id",
          "variant_id",
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

  const userId = z.string().parse(
    (
      await sql`
    select register_user(_name => ${userName}, _password => ${"dogbreath"}) user_id
  `
    )[0].user_id,
  );
  const userNameToId = new Map<string, string>([[userName, userId]]);

  await sql`insert into superusers values (${userId})`;

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
      userNameToId,
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
  const scriptArgs = process.argv.slice(2);
  const dbUrl = scriptArgs.length >= 1 ? scriptArgs[0] : LOCAL_DB_URL;
  const sql = postgres(dbUrl, {
    transform: {
      undefined: null,
    },
  });
  try {
    await sql.begin(async (sql) => {
      await populateDb(sql);
    });
  } finally {
    await sql.end();
  }
}

main();
