import {
  workoutBlockExerciseDefSchema,
  workoutBlockExerciseInstanceSchema,
  workoutDefSchema,
  workoutInstanceSchema,
} from "./db_types";
import { z } from "zod";

export const pastWorkoutInstanceSchema = workoutInstanceSchema.merge(
  z.object({
    workout_def_name: workoutDefSchema.shape.name,
    workout_def_description: workoutDefSchema.shape.description,
  }),
);

export type PastWorkoutInstance = z.infer<typeof pastWorkoutInstanceSchema>;

export const exerciseHistoryEntrySchema = z.object({
  def: workoutBlockExerciseDefSchema,
  instance: workoutBlockExerciseInstanceSchema,
});

export type ExerciseHistoryEntry = z.infer<typeof exerciseHistoryEntrySchema>;
