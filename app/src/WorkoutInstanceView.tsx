import { useCallback, useContext } from "react";

import { ConnectionContext } from "./connection";
import { NavStateContext } from "./navState";
import {
  workoutInstanceDenormalizedSchema,
  WorkoutInstanceDenormalized,
} from "./typespecs/denormalized_types";
import { NestedObjectPicker } from "./NestedObjectPicker";
import { useWorkoutToNestedObject } from "./useWorkoutToNestedObject";
import { sortWorkoutInstanceDenormalized } from "./sortedWorkoutInstanceDenormalized";
import { getPlaythroughExerciseInitialState } from "./playthroughTypes";

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

  const { nestedObject, modals } = useWorkoutToNestedObject({
    type: "workout_instance",
    data: workoutInstance,
    replaceData,
    connection,
  });

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

  const handlePlaythrough = useCallback(() => {
    const { sortedEntries } = sortWorkoutInstanceDenormalized(workoutInstance);
    if (!sortedEntries.length) {
      throw new Error("Cannot start workout: it has no exercises");
    }
    pushNavState({
      status: "playthrough_workout_instance",
      data: getPlaythroughExerciseInitialState({
        workout: workoutInstance,
        entry: sortedEntries[0],
      }),
    });
  }, [pushNavState, workoutInstance]);

  return (
    <>
      {modals}
      <div>
        <NestedObjectPicker nestedObject={nestedObject} />
        <br />
        <button onClick={handlePlaythrough}> Start workout! </button>
        <br />
        <button onClick={handleSetDescription}> Set instance notes </button>
        <br />
        {workoutInstance.started && !workoutInstance.finished && (
          <button onClick={handleSetFinished}> Mark finished </button>
        )}
        <button onClick={handleReload}> Reload </button>
        <br />
      </div>
    </>
  );
}
