import { WorkoutInstanceDenormalized } from "./typespecs/denormalized_types";
import { SortedWorkoutInstanceEntry } from "./sortedWorkoutInstanceDenormalized";

export type PlaythroughPhaseState = "transition" | "play";
export type PlaythroughTimerEntry = { type: "resume" | "pause"; time: Date };
export type PlaythroughState = {
  workout: WorkoutInstanceDenormalized;
  workout_set_exercise_instance_id: string;
  phase: PlaythroughPhaseState;
  timerEntries: PlaythroughTimerEntry[];
};

export function getPlaythroughExerciseInitialState({
  workout,
  entry,
}: {
  workout: WorkoutInstanceDenormalized;
  entry: SortedWorkoutInstanceEntry;
}): PlaythroughState {
  const { workout_set_idx, set_exercise_idx } = entry;
  const workoutSet = workout.workout_def.sets[workout_set_idx];
  const setExercise = workoutSet.exercises[set_exercise_idx];
  const phase = setExercise.exercise.name === "recover" ? "play" : "transition";
  return {
    workout,
    workout_set_exercise_instance_id: entry.instance.id,
    phase,
    timerEntries: [{ type: "resume", time: new Date() }],
  };
}
