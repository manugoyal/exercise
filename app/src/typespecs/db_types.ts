import { z } from "zod";

export const exerciseLimitTypeSchema = z.enum(["reps", "time_s"]);
export type ExerciseLimitType = z.infer<typeof exerciseLimitTypeSchema>;

export const datetimeSchema = z.coerce.date();

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const exerciseSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  name: z.string(),
  description: z.string().nullish(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const variantSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  name: z.string(),
  description: z.string().nullish(),
});
export type Variant = z.infer<typeof variantSchema>;

export const workoutDefSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  name: z.string(),
  description: z.string().nullish(),
});
export type WorkoutDef = z.infer<typeof workoutDefSchema>;

export const workoutSetDefSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  name: z.string().nullish(),
  description: z.string().nullish(),

  workout_def_id: z.string().uuid(),
  ordinal: z.number(),
  reps: z.number(),
  transition_time: z.number().nullish(),
});
export type WorkoutSetDef = z.infer<typeof workoutSetDefSchema>;

export const workoutSetExerciseDefSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  description: z.string().nullish(),

  workout_set_def_id: z.string().uuid(),
  ordinal: z.number(),

  exercise_id: z.string().uuid(),
  variant_id: z.string().uuid().nullish(),
  limit_type: exerciseLimitTypeSchema,
  limit_value: z.number(),
});
export type WorkoutSetExerciseDef = z.infer<typeof workoutSetExerciseDefSchema>;

export const workoutInstanceSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  description: z.string().nullish(),

  workout_def_id: z.string().uuid(),
  user_id: z.string().uuid(),

  started: datetimeSchema.nullish(),
  finished: datetimeSchema.nullish(),
});
export type WorkoutInstance = z.infer<typeof workoutInstanceSchema>;

export const workoutSetExerciseInstanceSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  description: z.string().nullish(),

  workout_instance_id: z.string().uuid(),

  workout_set_exercise_def_id: z.string().uuid(),
  set_rep: z.number(),

  weight_lbs: z.number().nullish(),
  limit_value: z.number(),
  started: datetimeSchema.nullish(),
  finished: datetimeSchema.nullish(),
});
export type WorkoutSetExerciseInstance = z.infer<
  typeof workoutSetExerciseInstanceSchema
>;

export const workoutCycleSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  name: z.string(),
  description: z.string().nullish(),

  user_id: z.string().uuid(),
});
export type WorkoutCycle = z.infer<typeof workoutCycleSchema>;

export const workoutCycleEntrySchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,

  workout_cycle_id: z.string().uuid(),
  workout_def_id: z.string().uuid(),
  ordinal: z.number(),
});
export type WorkoutCycleEntry = z.infer<typeof workoutCycleEntrySchema>;
