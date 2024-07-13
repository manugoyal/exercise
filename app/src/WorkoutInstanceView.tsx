import { useCallback, useContext, useEffect, useMemo } from "react";

import { ConnectionContext } from "./connection";
import { NavStateContext } from "./navState";
import {
  workoutInstanceDenormalizedSchema,
  WorkoutInstanceDenormalized,
} from "./typespecs/denormalized_types";
import { NestedObjectPicker } from "./NestedObjectPicker";
import { useWorkoutToNestedObject } from "./useWorkoutToNestedObject";
import { sortWorkoutInstanceDenormalized } from "./sortedWorkoutInstanceDenormalized";
import {
  PlaythroughExerciseInitialStateEntry,
  getPlaythroughExerciseInitialState,
} from "./playthroughTypes";

export function WorkoutInstanceView({
  workoutInstance,
}: {
  workoutInstance: WorkoutInstanceDenormalized;
}) {
  const { pushNavState, replaceNavState } = useContext(NavStateContext);
  const connection = useContext(ConnectionContext);

  const replaceData = useCallback(
    (data: WorkoutInstanceDenormalized) => {
      replaceNavState({ status: "view_workout_instance", data });
    },
    [replaceNavState],
  );

  const { sortedEntries } = useMemo(
    () => sortWorkoutInstanceDenormalized(workoutInstance),
    [workoutInstance],
  );

  // Determine the next exercise in the workout. This is defined as the exercise
  // after the last-finished exercise instance.
  const nextExerciseIdx = useMemo(() => {
    const lastFinishedExerciseIdx = sortedEntries.reduce(
      (latestIdx, entry, entryIdx) => {
        if (!entry.instance.finished) {
          return latestIdx;
        } else if (latestIdx === undefined) {
          return entryIdx;
        } else {
          const latestEntryFinished =
            sortedEntries[latestIdx].instance.finished;
          if (!latestEntryFinished) {
            throw new Error("Impossible");
          }
          return latestEntryFinished?.getTime() <
            entry.instance.finished.getTime()
            ? entryIdx
            : latestIdx;
        }
      },
      undefined as number | undefined,
    );
    if (
      lastFinishedExerciseIdx === undefined ||
      lastFinishedExerciseIdx + 1 >= sortedEntries.length
    ) {
      return 0;
    } else {
      return lastFinishedExerciseIdx + 1;
    }
  }, [sortedEntries]);

  const handleSetDescription = useCallback(async () => {
    const description = prompt(
      "Enter instance notes",
      workoutInstance.description ?? "",
    );
    if (description == null) return;
    const data = workoutInstanceDenormalizedSchema.parse(
      await connection.runRpc("patch_workout_instance", {
        _auth_id: connection.auth_id,
        _workout_instance_id: workoutInstance.id,
        _description: description,
      }),
    );
    replaceData(data);
  }, [
    connection,
    replaceData,
    workoutInstance.description,
    workoutInstance.id,
  ]);

  const handleSetFinished = useCallback(async () => {
    const data = workoutInstanceDenormalizedSchema.parse(
      await connection.runRpc("patch_workout_instance", {
        _auth_id: connection.auth_id,
        _workout_instance_id: workoutInstance.id,
        _finished: new Date(),
      }),
    );
    replaceData(data);
  }, [connection, replaceData, workoutInstance.id]);

  const handleReload = useCallback(async () => {
    const data = workoutInstanceDenormalizedSchema.parse(
      await connection.runRpc("get_workout_instance", {
        _auth_id: connection.auth_id,
        _id: workoutInstance.id,
      }),
    );
    replaceData(data);
  }, [connection, replaceData, workoutInstance.id]);

  const handleStartWorkout = useCallback(async () => {
    if (!sortedEntries.length) {
      throw new Error("Cannot start workout: it has no exercises");
    }
    const newWorkoutInstance = workoutInstanceDenormalizedSchema.parse(
      await connection.runRpc("patch_workout_instance", {
        _auth_id: connection.auth_id,
        _workout_instance_id: workoutInstance.id,
        _started: new Date(),
        _set_finished_to_null: true,
      }),
    );
    pushNavState({
      status: "playthrough_workout_instance",
      data: getPlaythroughExerciseInitialState({
        workout: newWorkoutInstance,
        entry: sortedEntries[0],
      }),
    });
  }, [connection, pushNavState, sortedEntries, workoutInstance.id]);

  const handleResumeWorkout = useCallback(() => {
    if (!sortedEntries.length) {
      throw new Error("Cannot resume workout: it has no exercises");
    }
    pushNavState({
      status: "playthrough_workout_instance",
      data: getPlaythroughExerciseInitialState({
        workout: workoutInstance,
        entry: sortedEntries[nextExerciseIdx],
      }),
    });
  }, [nextExerciseIdx, pushNavState, sortedEntries, workoutInstance]);

  const resumeWorkoutAtInstance = useCallback(
    (entry: PlaythroughExerciseInitialStateEntry) => {
      pushNavState({
        status: "playthrough_workout_instance",
        data: getPlaythroughExerciseInitialState({
          workout: workoutInstance,
          entry,
        }),
      });
    },
    [pushNavState, workoutInstance],
  );

  useEffect(() => {
    handleReload();
  }, [handleReload]);

  const canResume = workoutInstance.started && !workoutInstance.finished;

  const { nestedObject, modals } = useWorkoutToNestedObject({
    type: "workout_instance",
    data: workoutInstance,
    replaceData,
    resumeWorkoutAtInstance: canResume ? resumeWorkoutAtInstance : undefined,
    autoExpandEntry: canResume ? sortedEntries[nextExerciseIdx] : undefined,
    connection,
  });

  return (
    <>
      {modals}
      <div>
        <NestedObjectPicker nestedObject={nestedObject} />
        <br />
        {canResume ? (
          <button onClick={handleResumeWorkout}> Resume workout! </button>
        ) : (
          <button onClick={handleStartWorkout}>
            {" "}
            {workoutInstance.started ? "Restart" : "Start"} workout!{" "}
          </button>
        )}
        <br />
        <button onClick={handleSetDescription}> Set instance notes </button>
        <br />
        {workoutInstance.started && !workoutInstance.finished && (
          <>
            <button onClick={handleSetFinished}> Mark finished </button>
            <br />
          </>
        )}
        <button onClick={handleReload}> Reload </button>
        <br />
      </div>
    </>
  );
}
