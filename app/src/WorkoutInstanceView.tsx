import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ConnectionContext } from "./connection";
import { NavStateContext } from "./navState";
import {
  workoutInstanceDenormalizedSchema,
  WorkoutInstanceDenormalized,
} from "./typespecs/denormalized_types";
import { NestedObjectPicker } from "./NestedObjectPicker";
import { useWorkoutToNestedObject } from "./useWorkoutToNestedObject";
import {
  SortedWorkoutInstanceDenormalized,
  SortedWorkoutInstanceUndefined,
  sortWorkoutInstanceDenormalized,
} from "./sortedWorkoutInstanceDenormalized";
import {
  PlaythroughExerciseInitialStateEntry,
  getPlaythroughExerciseInitialState,
} from "./playthroughTypes";
import { Loading } from "./Loading";

export function WorkoutInstanceView({
  workoutInstanceId,
}: {
  workoutInstanceId: string;
}) {
  const { pushNavState } = useContext(NavStateContext);
  const connection = useContext(ConnectionContext);

  const [workoutInstance, setWorkoutInstance] = useState<
    WorkoutInstanceDenormalized | undefined
  >(undefined);

  useEffect(() => {
    if (workoutInstance !== undefined) {
      return;
    }

    async function getWorkoutInstance() {
      setWorkoutInstance(
        workoutInstanceDenormalizedSchema.parse(
          await connection.runRpc("get_workout_instance", {
            _auth_id: connection.auth_id,
            _id: workoutInstanceId,
          }),
        ),
      );
    }
    getWorkoutInstance();
  }, [connection, workoutInstance, workoutInstanceId]);

  const { sortedEntries } = useMemo(
    (): SortedWorkoutInstanceDenormalized | SortedWorkoutInstanceUndefined =>
      workoutInstance ? sortWorkoutInstanceDenormalized(workoutInstance) : {},
    [workoutInstance],
  );

  // Determine the next exercise in the workout. This is defined as the exercise
  // after the last-finished exercise instance.
  const nextExerciseIdx = useMemo((): number | undefined => {
    if (!sortedEntries) return undefined;
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
    if (!workoutInstance) {
      alert("Workout has not loaded");
      return;
    }
    const description = prompt(
      "Enter instance notes",
      workoutInstance.description ?? "",
    );
    if (description == null) return;
    setWorkoutInstance(
      workoutInstanceDenormalizedSchema.parse(
        await connection.runRpc("patch_workout_instance", {
          _auth_id: connection.auth_id,
          _workout_instance_id: workoutInstance.id,
          _description: description,
        }),
      ),
    );
  }, [connection, workoutInstance]);

  const handleSetFinished = useCallback(async () => {
    if (!workoutInstance) {
      alert("Workout has not loaded");
      return;
    }
    setWorkoutInstance(
      workoutInstanceDenormalizedSchema.parse(
        await connection.runRpc("patch_workout_instance", {
          _auth_id: connection.auth_id,
          _workout_instance_id: workoutInstance.id,
          _finished: new Date(),
        }),
      ),
    );
  }, [connection, workoutInstance]);

  const handleStartWorkout = useCallback(async () => {
    if (!(workoutInstance && sortedEntries)) {
      alert("Workout has not loaded");
      return;
    }
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
      data: {
        playthroughState: getPlaythroughExerciseInitialState({
          workout: newWorkoutInstance,
          entry: sortedEntries[0],
        }),
      },
    });
  }, [connection, pushNavState, sortedEntries, workoutInstance]);

  const handleResumeWorkout = useCallback(() => {
    if (!(workoutInstance && sortedEntries && nextExerciseIdx !== undefined)) {
      alert("Workout has not loaded");
      return;
    }
    if (!sortedEntries.length) {
      throw new Error("Cannot resume workout: it has no exercises");
    }
    pushNavState({
      status: "playthrough_workout_instance",
      data: {
        playthroughState: getPlaythroughExerciseInitialState({
          workout: workoutInstance,
          entry: sortedEntries[nextExerciseIdx],
        }),
      },
    });
  }, [nextExerciseIdx, pushNavState, sortedEntries, workoutInstance]);

  const resumeWorkoutAtInstance = useCallback(
    (entry: PlaythroughExerciseInitialStateEntry) => {
      if (!workoutInstance) {
        alert("Workout has not loaded");
        return;
      }
      pushNavState({
        status: "playthrough_workout_instance",
        data: {
          playthroughState: getPlaythroughExerciseInitialState({
            workout: workoutInstance,
            entry,
          }),
        },
      });
    },
    [pushNavState, workoutInstance],
  );

  const canResume =
    workoutInstance && workoutInstance.started && !workoutInstance.finished;

  const { nestedObject, modals } = useWorkoutToNestedObject({
    type: "workout_instance",
    data: workoutInstance,
    replaceData: setWorkoutInstance,
    resumeWorkoutAtInstance: canResume ? resumeWorkoutAtInstance : undefined,
    autoExpandEntry:
      canResume && sortedEntries && nextExerciseIdx !== undefined
        ? sortedEntries[nextExerciseIdx]
        : undefined,
    connection,
  });

  return nestedObject && workoutInstance ? (
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
        <button onClick={() => setWorkoutInstance(undefined)}> Reload </button>
        <br />
      </div>
    </>
  ) : (
    <Loading />
  );
}
