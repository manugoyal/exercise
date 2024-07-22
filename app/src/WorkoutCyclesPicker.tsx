import { useContext, useEffect, useMemo, useState } from "react";

import { ConnectionContext } from "./connection";
import {
  WorkoutCycleDenormalized,
  WorkoutDefDenormalized,
  workoutCycleDenormalizedSchema,
} from "./typespecs/denormalized_types";
import { Loading } from "./Loading";
import { NestedObject, NestedObjectPicker } from "./NestedObjectPicker";
import { NavState, NavStateContext } from "./navState";
import { lastFinishedText } from "./util";

function convertWorkoutCyclesToNestedObject({
  workoutCycles,
  pushNavState,
}: {
  workoutCycles: WorkoutCycleDenormalized[];
  pushNavState: (x: NavState) => void;
}): NestedObject {
  return {
    kind: "node",
    text: "Workout Cycles",
    children: workoutCycles.map((workoutCycle): NestedObject => {
      const entries = workoutCycle.entries;
      const lastFinishedEntries = workoutCycle.entries.reduce(
        (acc, workoutDef) => {
          if (workoutDef.last_finished) {
            return acc.concat({
              entry: workoutDef,
              last_finished: workoutDef.last_finished,
            });
          } else {
            return acc;
          }
        },
        new Array<{ entry: WorkoutDefDenormalized; last_finished: Date }>(),
      );
      lastFinishedEntries.sort(
        (lhs, rhs) => lhs.last_finished.getTime() - rhs.last_finished.getTime(),
      );
      const latestLastFinishedEntry = lastFinishedEntries.length
        ? lastFinishedEntries.at(-1)
        : undefined;
      const latestLastFinishedIdx =
        latestLastFinishedEntry &&
        entries.findIndex((e) => e === latestLastFinishedEntry.entry);
      const highlightedIdx =
        latestLastFinishedIdx === undefined
          ? 0
          : (latestLastFinishedIdx + 1) % entries.length;
      const entryToLastFinished = new Map<WorkoutDefDenormalized, Date>(
        lastFinishedEntries.map((x) => [x.entry, x.last_finished]),
      );
      return {
        kind: "node",
        text: workoutCycle.name,
        subtext: workoutCycle.description ?? undefined,
        children: entries.map(
          (workoutDef, idx): NestedObject => ({
            kind: "leaf",
            text: workoutDef.name,
            subtext: [
              workoutDef.description,
              lastFinishedText(entryToLastFinished.get(workoutDef)),
            ]
              .filter((x) => !!x)
              .join("\n"),
            highlight: idx === highlightedIdx,
            action: () => {
              pushNavState({
                status: "view_workout_def",
                data: { workoutDefId: workoutDef.id },
              });
            },
          }),
        ),
      };
    }),
  };
}

export function WorkoutCyclesPicker() {
  const connection = useContext(ConnectionContext);
  const { pushNavState } = useContext(NavStateContext);

  const [workoutCycles, setWorkoutCycles] = useState<
    WorkoutCycleDenormalized[] | undefined
  >(undefined);

  useEffect(() => {
    if (workoutCycles !== undefined) {
      return;
    }

    async function getWorkoutCycles() {
      const result = workoutCycleDenormalizedSchema.array().parse(
        await connection.runRpc("get_workout_cycles", {
          _auth_id: connection.auth_id,
        }),
      );
      setWorkoutCycles(result);
    }
    getWorkoutCycles();
  });

  const workoutCyclesNestedObject = useMemo(
    () =>
      workoutCycles &&
      convertWorkoutCyclesToNestedObject({ workoutCycles, pushNavState }),
    [workoutCycles, pushNavState],
  );

  if (!workoutCyclesNestedObject) {
    return <Loading />;
  }

  return (
    <div>
      <NestedObjectPicker nestedObject={workoutCyclesNestedObject} />
      <br />
      <button onClick={() => setWorkoutCycles(undefined)}> Reload </button>
    </div>
  );
}
