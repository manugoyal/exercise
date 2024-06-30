import { WorkoutInstanceDenormalized } from "./typespecs/denormalized_types";
import { SortedWorkoutInstanceEntry } from "./sortedWorkoutInstanceDenormalized";

export type PlaythroughPhaseState = "transition" | "play";
export type PlaythroughTimerEntry = { type: "resume" | "pause"; time: Date };
export type PlaythroughState = {
  workout: WorkoutInstanceDenormalized;
  workout_block_exercise_instance_id: string;
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
  const { workout_block_idx, block_exercise_idx } = entry;
  const workoutBlock = workout.workout_def.blocks[workout_block_idx];
  const blockExercise = workoutBlock.exercises[block_exercise_idx];
  const phase =
    blockExercise.exercise.name === "recover" ? "play" : "transition";
  return {
    workout,
    workout_block_exercise_instance_id: entry.instance.id,
    phase,
    timerEntries: [{ type: "resume", time: new Date() }],
  };
}
