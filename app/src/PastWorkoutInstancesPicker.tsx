import { useContext, useEffect, useMemo, useState } from "react";

import { ConnectionContext } from "./connection";
import {
  pastWorkoutInstanceSchema,
  PastWorkoutInstance,
} from "./typespecs/app_types";
import { Loading } from "./Loading";
import { NestedObject, NestedObjectPicker } from "./NestedObjectPicker";
import { NavState, NavStateContext } from "./navState";
import {
  instanceNotesText,
  createdOnText,
  startedOnText,
  finishedOnText,
} from "./util";

function convertPastWorkoutInstancesToNestedObject({
  pastWorkoutInstances,
  pushNavState,
}: {
  pastWorkoutInstances: PastWorkoutInstance[];
  pushNavState: (x: NavState) => void;
}): NestedObject {
  // Display in two sections: incomplete workouts (started but not finished,
  // ordered by started descending) and all past workouts (ordered by created
  // descending).
  const incompleteWorkouts = pastWorkoutInstances.filter(
    (x) => x.started && !x.finished,
  );
  incompleteWorkouts.sort((lhs, rhs) => {
    if (!(lhs.started && rhs.started)) {
      throw new Error("Impossible");
    }
    return rhs.started.getTime() - lhs.started.getTime();
  });
  const allWorkouts = [...pastWorkoutInstances];
  allWorkouts.sort((lhs, rhs) => rhs.created.getTime() - lhs.created.getTime());

  function makeLeafNode(x: PastWorkoutInstance): NestedObject {
    return {
      kind: "leaf",
      text: x.workout_def_name,
      subtext: [
        ...(x.started
          ? [startedOnText(x.started), finishedOnText(x.finished)]
          : [createdOnText(x.created)]),
        x.workout_def_description,
        instanceNotesText(x.description),
      ]
        .filter((x) => !!x)
        .join("\n"),
      action: async () => {
        pushNavState({
          status: "view_workout_instance",
          data: { workoutInstanceId: x.id },
        });
      },
    };
  }

  return {
    kind: "node",
    text: "Past Workout Instances",
    children: [
      {
        kind: "node",
        text: "Incomplete Workouts",
        children: incompleteWorkouts.map(makeLeafNode),
      },
      {
        kind: "node",
        text: "All Workouts",
        children: allWorkouts.map(makeLeafNode),
      },
    ],
  };
}

export function PastWorkoutInstancesPicker() {
  const connection = useContext(ConnectionContext);
  const { pushNavState } = useContext(NavStateContext);

  const [pastWorkoutInstances, setPastWorkoutInstances] = useState<
    PastWorkoutInstance[] | undefined
  >(undefined);

  useEffect(() => {
    if (pastWorkoutInstances !== undefined) {
      return;
    }

    async function getPastWorkoutInstances() {
      const result = pastWorkoutInstanceSchema.array().parse(
        await connection.runRpc("get_past_workout_instances", {
          _auth_id: connection.auth_id,
          _limit: 1000,
        }),
      );
      setPastWorkoutInstances(result);
    }
    getPastWorkoutInstances();
  });

  const pastWorkoutInstancesNestedObject = useMemo(
    () =>
      pastWorkoutInstances &&
      convertPastWorkoutInstancesToNestedObject({
        pastWorkoutInstances,
        pushNavState,
      }),
    [pastWorkoutInstances, pushNavState],
  );

  if (!pastWorkoutInstancesNestedObject) {
    return <Loading />;
  }

  return (
    <div>
      <NestedObjectPicker nestedObject={pastWorkoutInstancesNestedObject} />
      <br />
      <button onClick={() => setPastWorkoutInstances(undefined)}>
        {" "}
        Reload{" "}
      </button>
    </div>
  );
}
