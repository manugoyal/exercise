// Typespecs for importing / exporting data.

import { z } from "zod";
import {
  exerciseSchema,
  variantSchema,
  workoutCycleSchema,
  workoutDefSchema,
  workoutBlockDefSchema,
  workoutBlockExerciseDefSchema,
} from "./db_types";
import { workoutInstanceDenormalizedSchema } from "./denormalized_types";

export const exerciseIOSchema = z.object({
  id: exerciseSchema.shape.id.nullish(),
  name: exerciseSchema.shape.name,
  description: exerciseSchema.shape.description,
});
export type ExerciseIO = z.infer<typeof exerciseIOSchema>;

export const variantIOSchema = z.object({
  id: variantSchema.shape.id.nullish(),
  name: variantSchema.shape.name,
  description: variantSchema.shape.description,
});
export type VariantIO = z.infer<typeof variantIOSchema>;

export const workoutDefIOSchema = workoutDefSchema
  .omit({ id: true, created: true, user_id: true })
  .merge(
    z.object({
      id: workoutDefSchema.shape.id.nullish(),
      blocks: workoutBlockDefSchema
        .omit({ id: true, created: true, workout_def_id: true, ordinal: true })
        .merge(
          z.object({
            exercises: workoutBlockExerciseDefSchema
              .omit({
                id: true,
                created: true,
                workout_block_def_id: true,
                ordinal: true,
                exercise_id: true,
              })
              .merge(
                z.object({
                  exercise: exerciseSchema.shape.name,
                  variants: variantSchema.shape.name.array().nullish(),
                }),
              )
              .array(),
          }),
        )
        .array(),
    }),
  );
export type WorkoutDefIO = z.infer<typeof workoutDefIOSchema>;

export const workoutCycleIOSchema = workoutCycleSchema
  .omit({ id: true, created: true, user_id: true })
  .merge(
    z.object({
      id: workoutCycleSchema.shape.id.nullish(),
      entries: workoutDefSchema.shape.name.array(),
    }),
  );
export type WorkoutCycleIO = z.infer<typeof workoutCycleIOSchema>;

export const ioDataSchema = z.object({
  exercises: exerciseIOSchema.array().nullish(),
  variants: variantIOSchema.array().nullish(),
  workout_defs: workoutDefIOSchema.array().nullish(),
  workout_cycles: workoutCycleIOSchema.array().nullish(),
  workout_instances: workoutInstanceDenormalizedSchema.array().nullish(),
});
export type IOData = z.infer<typeof ioDataSchema>;
