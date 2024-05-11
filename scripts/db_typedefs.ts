import { z } from "zod";

export const exerciseLimitTypeSchema = z.enum(["reps", "time"]);

export type ExerciseLimitType = z.infer<typeof exerciseLimitTypeSchema>;
