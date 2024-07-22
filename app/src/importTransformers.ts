import { Connection } from "./connection";
import { IOData } from "./typespecs/io_types";
import {
  Exercise,
  Variant,
  WorkoutDef,
  WorkoutBlockDef,
  WorkoutBlockExerciseDef,
  WorkoutBlockExerciseVariant,
  WorkoutCycle,
  WorkoutCycleEntry,
} from "./typespecs/db_types";
import { z } from "zod";
import { v4 as uuid4 } from "uuid";

// Corresponds to the function signature of execute_import.
export type ExecutableImport = {
  _insert_exercises: Exercise[];
  _update_exercises: Exercise[];
  _insert_variants: Variant[];
  _update_variants: Variant[];
  _insert_workout_defs: WorkoutDef[];
  _update_workout_defs: WorkoutDef[];
  _insert_workout_block_defs: WorkoutBlockDef[];
  _update_workout_block_defs: WorkoutBlockDef[];
  _insert_workout_block_exercise_defs: WorkoutBlockExerciseDef[];
  _update_workout_block_exercise_defs: WorkoutBlockExerciseDef[];
  _insert_workout_block_exercise_variants: WorkoutBlockExerciseVariant[];
  _update_workout_block_exercise_variants: WorkoutBlockExerciseVariant[];
  _insert_workout_cycles: WorkoutCycle[];
  _update_workout_cycles: WorkoutCycle[];
  _insert_workout_cycle_entries: WorkoutCycleEntry[];
  _update_workout_cycle_entries: WorkoutCycleEntry[];
};

export async function transformIoData({
  connection,
  ioData,
}: {
  connection: Connection;
  ioData: IOData;
}): Promise<ExecutableImport> {
  // We need "valid" created and user_id values to satisfy the schemas, even
  // though they won't be used.
  const created = new Date(0);
  const user_id = "00000000-0000-0000-0000-000000000000";

  const ret: ExecutableImport = {
    _insert_exercises: [],
    _update_exercises: [],
    _insert_variants: [],
    _update_variants: [],
    _insert_workout_defs: [],
    _update_workout_defs: [],
    _insert_workout_block_defs: [],
    _update_workout_block_defs: [],
    _insert_workout_block_exercise_defs: [],
    _update_workout_block_exercise_defs: [],
    _insert_workout_block_exercise_variants: [],
    _update_workout_block_exercise_variants: [],
    _insert_workout_cycles: [],
    _update_workout_cycles: [],
    _insert_workout_cycle_entries: [],
    _update_workout_cycle_entries: [],
  };

  const usedExerciseNames = new Set<string>();
  const usedVariantNames = new Set<string>();
  const usedWorkoutDefNames = new Set<string>();

  ioData.workout_defs?.forEach((workoutDef) => {
    workoutDef.blocks.forEach((block) => {
      block.exercises.forEach((exercise) => {
        usedExerciseNames.add(exercise.exercise);
        exercise.variants?.forEach((variant) => {
          usedVariantNames.add(variant);
        });
      });
    });
  });

  ioData.workout_cycles?.forEach((cycle) => {
    cycle.entries.forEach((entry) => {
      usedWorkoutDefNames.add(entry);
    });
  });

  const exerciseNameToId = z.record(z.string().uuid()).parse(
    connection.runRpc("get_exercises_by_name", {
      _auth_id: connection.auth_id,
      _names: Array.from(usedExerciseNames),
    }),
  );

  const variantNameToId = z.record(z.string().uuid()).parse(
    connection.runRpc("get_variants_by_name", {
      _auth_id: connection.auth_id,
      _names: Array.from(usedVariantNames),
    }),
  );

  const workoutDefNameToId = z.record(z.string().uuid()).parse(
    connection.runRpc("get_workout_defs_by_name", {
      _auth_id: connection.auth_id,
      _names: Array.from(usedWorkoutDefNames),
    }),
  );

  // Fill in the full schema for all given exercises and variants.

  ioData.exercises?.forEach((exercise) => {
    const exercise_id = exercise.id ?? uuid4();
    (exercise.id ? ret._update_exercises : ret._insert_exercises).push({
      ...exercise,
      id: exercise_id,
      created,
    });
    exerciseNameToId[exercise.name] = exercise_id;
  });

  ioData.variants?.forEach((variant) => {
    const variant_id = variant.id ?? uuid4();
    (variant.id ? ret._update_variants : ret._insert_variants).push({
      ...variant,
      id: variant_id,
      created,
    });
    variantNameToId[variant.name] = variant_id;
  });

  ioData.workout_defs?.forEach((workoutDef) => {
    const workout_def_id = workoutDef.id ?? uuid4();
    const { blocks, ...workoutDefRest } = workoutDef;
    (workoutDef.id ? ret._update_workout_defs : ret._insert_workout_defs).push({
      ...workoutDefRest,
      id: workout_def_id,
      created,
      user_id,
    });
    workoutDefNameToId[workoutDef.name] = workout_def_id;
    blocks.forEach((block, ordinal) => {
      const workout_block_def_id = block.id ?? uuid4();
      const { exercises, ...blockRest } = block;
      (block.id
        ? ret._update_workout_block_defs
        : ret._insert_workout_block_defs
      ).push({
        ...blockRest,
        id: workout_block_def_id,
        created,
        workout_def_id,
        ordinal,
      });
      exercises.forEach((blockExercise, ordinal) => {
        const workout_block_exercise_def_id = blockExercise.id ?? uuid4();
        const { exercise, variants, ...blockExerciseRest } = blockExercise;
        (blockExercise.id
          ? ret._update_workout_block_exercise_defs
          : ret._insert_workout_block_exercise_defs
        ).push({
          ...blockExerciseRest,
          id: workout_block_exercise_def_id,
          created,
          workout_block_def_id,
          ordinal,
          exercise_id: recordAt(exerciseNameToId, exercise),
        });
        (blockExercise.id
          ? ret._update_workout_block_exercise_variants
          : ret._insert_workout_block_exercise_variants
        ).push(
          ...(variants ?? []).map((variant) => ({
            workout_block_exercise_def_id,
            variant_id: recordAt(variantNameToId, variant),
          })),
        );
      });
    });
  });

  ioData.workout_cycles?.forEach((cycle) => {
    const workout_cycle_id = cycle.id ?? uuid4();
    (cycle.id ? ret._update_workout_cycles : ret._insert_workout_cycles).push({
      ...cycle,
      id: workout_cycle_id,
      created,
      user_id,
    });
    (cycle.id
      ? ret._update_workout_cycle_entries
      : ret._insert_workout_cycle_entries
    ).push(
      ...cycle.entries.map((entry, ordinal) => ({
        workout_cycle_id,
        workout_def_id: recordAt(workoutDefNameToId, entry),
        ordinal,
      })),
    );
  });

  return ret;
}

function recordFind<K extends string | number | symbol, V>(
  m: { [k in K]?: V },
  k: K,
): V | undefined {
  return m[k];
}

function recordAt<K extends string | number | symbol, V>(
  m: { [k in K]?: V },
  k: K,
): V {
  const ret = recordFind(m, k);
  if (!ret) {
    throw new Error(`Key ${String(k)} not found in record`);
  }
  return ret;
}
