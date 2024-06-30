import sortBy from "lodash.sortby";

import { WorkoutInstanceDenormalized } from "./typespecs/denormalized_types";

type WorkoutInstance = WorkoutInstanceDenormalized["block_exercises"][number];

export type SortedWorkoutInstanceEntry = {
  instance: WorkoutInstance;
  // Locate the exercise within the corresponding workoutDef.
  workout_block_idx: number;
  block_exercise_idx: number;
};

export type SortedWorkoutInstanceDenormalized = {
  workout: WorkoutInstanceDenormalized;
  sortedEntries: SortedWorkoutInstanceEntry[];
  entryIdToSortedEntryIdx: Map<string, number>;
};

export function sortWorkoutInstanceDenormalized(
  workout: WorkoutInstanceDenormalized,
): SortedWorkoutInstanceDenormalized {
  // Collect all the instance entries.
  const exerciseIdAndSetRepToInstance = new Map<string, WorkoutInstance>(
    workout.block_exercises.map((e) => [
      JSON.stringify({
        exercise_id: e.workout_block_exercise_def_id,
        set_num: e.set_num,
      }),
      e,
    ]),
  );
  // Create a list of sorted entries.
  const sortedEntries: Array<SortedWorkoutInstanceEntry> =
    workout.workout_def.blocks.flatMap((b, blockIdx) =>
      Array.from({ length: b.sets })
        .map((_, idx) => idx + 1)
        .flatMap((set_num) =>
          b.exercises.reduce((acc, e, exerciseIdx) => {
            const instance = exerciseIdAndSetRepToInstance.get(
              JSON.stringify({ exercise_id: e.id, set_num }),
            );
            if (!instance) return acc;
            return acc.concat([
              {
                instance,
                workout_block_idx: blockIdx,
                block_exercise_idx: exerciseIdx,
              },
            ]);
          }, new Array<SortedWorkoutInstanceEntry>()),
        ),
    );
  sortBy(sortedEntries, [
    "workout_block_idx",
    "block_exercise_idx",
    (x) => x.instance.set_num,
  ]);
  const entryIdToSortedEntryIdx = new Map<string, number>(
    sortedEntries.map((x, idx) => [x.instance.id, idx]),
  );
  return { workout, sortedEntries, entryIdToSortedEntryIdx };
}
