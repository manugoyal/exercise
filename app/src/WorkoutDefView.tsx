import { useCallback, useContext, useEffect, useState } from "react";

import { ConnectionContext } from "./connection";
import {
  workoutDefDenormalizedSchema,
  workoutInstanceDenormalizedSchema,
  WorkoutDefDenormalized,
} from "./typespecs/denormalized_types";
import { NestedObjectPicker } from "./NestedObjectPicker";
import { NavStateContext } from "./navState";
import { useWorkoutToNestedObject } from "./useWorkoutToNestedObject";
import { Loading } from "./Loading";

export function WorkoutDefView({ workoutDefId }: { workoutDefId: string }) {
  const connection = useContext(ConnectionContext);
  const { pushNavState } = useContext(NavStateContext);

  const [workoutDef, setWorkoutDef] = useState<
    WorkoutDefDenormalized | undefined
  >(undefined);

  useEffect(() => {
    if (workoutDef !== undefined) {
      return;
    }

    async function getWorkoutDef() {
      setWorkoutDef(
        workoutDefDenormalizedSchema.parse(
          await connection.runRpc("get_workout_def", {
            _auth_id: connection.auth_id,
            _id: workoutDefId,
          }),
        ),
      );
    }
    getWorkoutDef();
  }, [connection, workoutDef, workoutDefId]);

  const { nestedObject, modals } = useWorkoutToNestedObject({
    type: "workout_def",
    data: workoutDef,
  });

  const instantiateWorkout = useCallback(async () => {
    if (!workoutDef) {
      alert("Workout has not yet loaded");
      return;
    }
    const resp = workoutInstanceDenormalizedSchema.parse(
      await connection.runRpc("instantiate_workout", {
        _auth_id: connection.auth_id,
        _workout_def_id: workoutDef.id,
      }),
    );
    pushNavState({
      status: "view_workout_instance",
      data: { workoutInstanceId: resp.id },
    });
  }, [connection, pushNavState, workoutDef]);

  return nestedObject ? (
    <div>
      <NestedObjectPicker nestedObject={nestedObject} />
      <br />
      <button onClick={instantiateWorkout}> Instantiate workout </button>
      <br />
      <button onClick={() => setWorkoutDef(undefined)}> Reload </button>
      {modals}
    </div>
  ) : (
    <Loading />
  );
}
