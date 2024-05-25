import { z } from "zod";
import {
  datetimeSchema,
  exerciseSchema,
  variantSchema,
  workoutCycleSchema,
  workoutCycleEntrySchema,
  workoutDefSchema,
  workoutSetDefSchema,
  workoutSetExerciseDefSchema,
  workoutInstanceSchema,
  workoutSetExerciseInstanceSchema,
  userSchema,
} from "./db_types";

export const workoutDefDenormalizedSchema = workoutDefSchema.merge(
  z.object({
    sets: workoutSetDefSchema
      .omit({ workout_def_id: true, ordinal: true })
      .merge(
        z.object({
          exercises: workoutSetExerciseDefSchema
            .omit({
              workout_set_def_id: true,
              ordinal: true,
              exercise_id: true,
              variant_id: true,
            })
            .merge(
              z.object({
                exercise: exerciseSchema,
                variant: variantSchema.nullish(),
              }),
            )
            .array(),
        }),
      )
      .array(),
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
      set_exercises: workoutSetExerciseInstanceSchema
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
            last_finished: datetimeSchema.nullish(),
          }),
        )
        .array(),
    }),
  );
export type WorkoutCycleDenormalized = z.infer<
  typeof workoutCycleDenormalizedSchema
>;
