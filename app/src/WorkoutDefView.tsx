import { useContext, useMemo } from "react";

import { ConnectionContext } from "./connection";
import {
  workoutInstanceDenormalizedSchema,
  WorkoutDefDenormalized,
} from "./typespecs/denormalized_types";
import { NestedObjectPicker } from "./NestedObjectPicker";
import { NavStateContext } from "./navState";
import { workoutToNestedObject } from "./workout_to_nested_object";

export function WorkoutDefView({
  workoutDef,
}: {
  workoutDef: WorkoutDefDenormalized;
}) {
  const connection = useContext(ConnectionContext);
  const { pushNavState } = useContext(NavStateContext);

  const workoutDefNestedObject = useMemo(
    () => workoutToNestedObject({ type: "workout_def", data: workoutDef }),
    [workoutDef],
  );

  async function instantiateWorkout() {
    const resp = workoutInstanceDenormalizedSchema.parse(
      await connection.runRpc("instantiate_workout", {
        _auth_id: connection.auth_id,
        _workout_def_id: workoutDef.id,
      }),
    );
    pushNavState({ status: "view_workout_instance", data: resp });
  }

  return (
    <div>
      <NestedObjectPicker nestedObject={workoutDefNestedObject} />
      <br />
      <button onClick={instantiateWorkout}> Instantiate workout </button>
    </div>
  );
}
