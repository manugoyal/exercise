import { z } from "zod";

import {
  exerciseSchema,
  variantSchema,
  workoutCycleSchema,
  workoutCycleEntrySchema,
  workoutDefSchema,
  workoutSetDefSchema,
  workoutSetExerciseDefSchema,
} from "../app/src/typespecs/db_types";

export const createExerciseSchema = z.object({
  name: exerciseSchema.shape.name,
  description: exerciseSchema.shape.description,
});

export const createVariantSchema = z.object({
  name: variantSchema.shape.name,
  description: variantSchema.shape.description,
});

export const createWorkoutDefSchema = workoutDefSchema
  .omit({ id: true, created: true })
  .merge(
    z.object({
      sets: workoutSetDefSchema
        .omit({ id: true, created: true, workout_def_id: true, ordinal: true })
        .merge(
          z.object({
            exercises: workoutSetExerciseDefSchema
              .omit({
                id: true,
                created: true,
                workout_set_def_id: true,
                ordinal: true,
                exercise_id: true,
                variant_id: true,
              })
              .merge(
                z.object({
                  exercise_name: z.string(),
                  variant_name: z.string().nullish(),
                }),
              )
              .array(),
          }),
        )
        .array(),
    }),
  );

export const createWorkoutCycleSchema = workoutCycleSchema
  .omit({ id: true, created: true, user_id: true })
  .merge(
    z.object({
      user_name: z.string(),
      entries: workoutCycleEntrySchema
        .omit({
          id: true,
          created: true,
          workout_cycle_id: true,
          workout_def_id: true,
          ordinal: true,
        })
        .merge(
          z.object({
            workout_def_name: z.string(),
          }),
        )
        .array(),
    }),
  );

export type CreateExercise = z.infer<typeof createExerciseSchema>;
export type CreateVariant = z.infer<typeof createVariantSchema>;
export type CreateWorkout = z.infer<typeof createWorkoutDefSchema>;
export type CreateWorkoutCycle = z.infer<typeof createWorkoutCycleSchema>;
