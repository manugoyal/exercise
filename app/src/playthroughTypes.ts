import { WorkoutInstanceDenormalized } from "./typespecs/denormalized_types";
import { isRecoverExercise } from "./util";

export type PlaythroughPhaseState = "transition" | "play";
export type PlaythroughTimerEntry = { type: "resume" | "pause"; time: Date };
export type PlaythroughState = {
  workout: WorkoutInstanceDenormalized;
  workout_block_exercise_instance_id: string;
  phase: PlaythroughPhaseState;
  timerEntries: PlaythroughTimerEntry[];
};

export type PlaythroughExerciseInitialStateEntry = {
  workout_block_idx: number;
  block_exercise_idx: number;
  instance: { id: string };
};

export function getPlaythroughExerciseInitialState({
  workout,
  entry,
}: {
  workout: WorkoutInstanceDenormalized;
  entry: PlaythroughExerciseInitialStateEntry;
}): PlaythroughState {
  const { workout_block_idx, block_exercise_idx, instance } = entry;
  const workoutBlock = workout.workout_def.blocks[workout_block_idx];
  const blockExercise = workoutBlock.exercises[block_exercise_idx];
  const phase = isRecoverExercise(blockExercise.exercise.name)
    ? "play"
    : "transition";
  return {
    workout,
    workout_block_exercise_instance_id: instance.id,
    phase,
    timerEntries: [{ type: "resume", time: new Date() }],
  };
}
