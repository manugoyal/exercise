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
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullish(),
});
export type WorkoutDef = z.infer<typeof workoutDefSchema>;

export const workoutBlockDefSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  name: z.string().nullish(),
  description: z.string().nullish(),

  workout_def_id: z.string().uuid(),
  ordinal: z.number(),
  sets: z.number(),
  transition_time: z.number().nullish(),
});
export type WorkoutBlockDef = z.infer<typeof workoutBlockDefSchema>;

export const workoutBlockExerciseDefSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  description: z.string().nullish(),

  workout_block_def_id: z.string().uuid(),
  ordinal: z.number(),

  exercise_id: z.string().uuid(),
  limit_type: exerciseLimitTypeSchema,
  limit_value: z.number(),
});
export type WorkoutBlockExerciseDef = z.infer<
  typeof workoutBlockExerciseDefSchema
>;

export const workoutBlockExerciseVariantsSchema = z.object({
  workout_block_exercise_def_id: z.string().uuid(),
  variant_id: z.string().uuid(),
});
export type WorkoutBlockExerciseVariant = z.infer<
  typeof workoutBlockExerciseVariantsSchema
>;

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

export const workoutBlockExerciseInstanceSchema = z.object({
  id: z.string().uuid(),
  created: datetimeSchema,
  description: z.string().nullish(),

  workout_instance_id: z.string().uuid(),

  workout_block_exercise_def_id: z.string().uuid(),
  set_num: z.number(),

  weight_lbs: z.number(),
  limit_value: z.number(),
  started: datetimeSchema.nullish(),
  finished: datetimeSchema.nullish(),
  paused_time_s: z.number().nullish(),
});
export type WorkoutBlockExerciseInstance = z.infer<
  typeof workoutBlockExerciseInstanceSchema
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
  workout_cycle_id: z.string().uuid(),
  workout_def_id: z.string().uuid(),
  ordinal: z.number(),
});
export type WorkoutCycleEntry = z.infer<typeof workoutCycleEntrySchema>;
