import sortBy from "lodash.sortby";

import { WorkoutInstanceDenormalized } from "./typespecs/denormalized_types";

type WorkoutInstance = WorkoutInstanceDenormalized["set_exercises"][number];

export type SortedWorkoutInstanceEntry = {
  instance: WorkoutInstance;
  // Locate the exercise within the corresponding workoutDef.
  workout_set_idx: number;
  set_exercise_idx: number;
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
    workout.set_exercises.map((e) => [
      JSON.stringify({
        exercise_id: e.workout_set_exercise_def_id,
        set_rep: e.set_rep,
      }),
      e,
    ]),
  );
  // Create a list of sorted entries.
  const sortedEntries: Array<SortedWorkoutInstanceEntry> =
    workout.workout_def.sets.flatMap((s, setIdx) =>
      Array.from({ length: s.reps })
        .map((_, idx) => idx + 1)
        .flatMap((set_rep) =>
          s.exercises.reduce((acc, e, exerciseIdx) => {
            const instance = exerciseIdAndSetRepToInstance.get(
              JSON.stringify({ exercise_id: e.id, set_rep }),
            );
            if (!instance) return acc;
            return acc.concat([
              {
                instance,
                workout_set_idx: setIdx,
                set_exercise_idx: exerciseIdx,
              },
            ]);
          }, new Array<SortedWorkoutInstanceEntry>()),
        ),
    );
  sortBy(sortedEntries, [
    "workout_set_idx",
    "set_exercise_idx",
    (x) => x.instance.set_rep,
  ]);
  const entryIdToSortedEntryIdx = new Map<string, number>(
    sortedEntries.map((x, idx) => [x.instance.id, idx]),
  );
  return { workout, sortedEntries, entryIdToSortedEntryIdx };
}
