import { z } from "zod";
import {
  datetimeSchema,
  exerciseSchema,
  variantSchema,
  workoutCycleSchema,
  workoutCycleEntrySchema,
  workoutDefSchema,
  workoutBlockDefSchema,
  workoutBlockExerciseDefSchema,
  workoutInstanceSchema,
  workoutBlockExerciseInstanceSchema,
  userSchema,
} from "./db_types";

export const workoutDefDenormalizedSchema = workoutDefSchema
  .omit({ user_id: true })
  .merge(
    z.object({
      user: userSchema,
      blocks: workoutBlockDefSchema
        .omit({ workout_def_id: true, ordinal: true })
        .merge(
          z.object({
            exercises: workoutBlockExerciseDefSchema
              .omit({
                workout_block_def_id: true,
                ordinal: true,
                exercise_id: true,
              })
              .merge(
                z.object({
                  exercise: exerciseSchema,
                  variants: variantSchema.array(),
                }),
              )
              .array(),
          }),
        )
        .array(),
      last_finished: datetimeSchema.nullish(),
    }),
  );
export type WorkoutDefDenormalized = z.infer<
  typeof workoutDefDenormalizedSchema
>;

export const workoutInstanceDenormalizedSchema = workoutInstanceSchema
  .omit({ workout_def_id: true, user_id: true })
  .merge(
    z.object({
      workout_def: workoutDefDenormalizedSchema,
      user: userSchema,
      block_exercises: workoutBlockExerciseInstanceSchema
        .omit({ workout_instance_id: true })
        .array(),
    }),
  );
export type WorkoutInstanceDenormalized = z.infer<
  typeof workoutInstanceDenormalizedSchema
>;

export const workoutCycleDenormalizedSchema = workoutCycleSchema
  .omit({ user_id: true })
  .merge(
    z.object({
      user: userSchema,
      entries: workoutCycleEntrySchema
        .omit({ workout_cycle_id: true, workout_def_id: true, ordinal: true })
        .merge(
          z.object({
            workout_def: workoutDefDenormalizedSchema,
          }),
        )
        .array(),
    }),
  );
export type WorkoutCycleDenormalized = z.infer<
  typeof workoutCycleDenormalizedSchema
>;
