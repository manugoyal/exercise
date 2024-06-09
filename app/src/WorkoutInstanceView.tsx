import { useCallback, useContext, useMemo } from "react";

import { ConnectionContext } from "./connection";
import { NavStateContext } from "./navState";
import {
  workoutInstanceDenormalizedSchema,
  WorkoutInstanceDenormalized,
} from "./typespecs/denormalized_types";
import { NestedObjectPicker } from "./NestedObjectPicker";
import { workoutToNestedObject } from "./workout_to_nested_object";

export function WorkoutInstanceView({
  workoutInstance,
}: {
  workoutInstance: WorkoutInstanceDenormalized;
}) {
  const { replaceNavState } = useContext(NavStateContext);
  const connection = useContext(ConnectionContext);

  const replaceData = useCallback((data: WorkoutInstanceDenormalized) => {
    replaceNavState({ status: "view_workout_instance", data });
  }, []);

  const workoutInstanceNestedObject = useMemo(
    () =>
      workoutToNestedObject({
        type: "workout_instance",
        data: workoutInstance,
        replaceData,
        connection,
      }),
    [workoutInstance],
  );

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
  }, []);

  const handleSetFinished = useCallback(async () => {
    const data = workoutInstanceDenormalizedSchema.parse(
      await connection.runRpc("patch_workout_instance", {
        _auth_id: connection.auth_id,
        _workout_instance_id: workoutInstance.id,
        _finished: new Date(),
      }),
    );
    replaceData(data);
  }, []);

  return (
    <div>
      <NestedObjectPicker nestedObject={workoutInstanceNestedObject} />
      <br />
      <button onClick={handleSetDescription}> Set instance notes </button>
      <br />
      {workoutInstance.started && !workoutInstance.finished && (
        <button onClick={handleSetFinished}> Mark finished </button>
      )}
    </div>
  );
}
