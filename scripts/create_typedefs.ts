import { z } from "zod";

import { exerciseLimitTypeSchema } from "./db_typedefs";

export const createExerciseSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
});

export const createVariantSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
});

export const createWorkoutDefSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
  sets: z
    .object({
      name: z.string().nullish(),
      description: z.string().nullish(),
      reps: z.number().int().positive(),
      transition_time: z.number().nullish(),
      exercises: z
        .object({
          description: z.string().nullish(),
          exercise_name: z.string(),
          variant_name: z.string().nullish(),
          limit_type: exerciseLimitTypeSchema,
          limit_value: z.number(),
        })
        .array(),
    })
    .array(),
});

export type CreateExercise = z.infer<typeof createExerciseSchema>;
export type CreateVariant = z.infer<typeof createVariantSchema>;
export type CreateWorkout = z.infer<typeof createWorkoutDefSchema>;
