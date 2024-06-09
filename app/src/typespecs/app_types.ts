import { workoutDefSchema, workoutInstanceSchema } from "./db_types";
import { z } from "zod";

export const pastWorkoutInstanceSchema = workoutInstanceSchema.merge(
  z.object({
    workout_def_name: workoutDefSchema.shape.name,
    workout_def_description: workoutDefSchema.shape.description,
  }),
);

export type PastWorkoutInstance = z.infer<typeof pastWorkoutInstanceSchema>;

//export const patchWorkoutInstanceDefault = {
//    _workout_
//} as const;
