import { useContext, useEffect, useMemo, useState } from "react";

import { ConnectionContext } from "./connection";
import { ErrorContext, wrapAsync } from "./errorContext";
import {
  WorkoutCycleDenormalized,
  workoutCycleDenormalizedSchema,
} from "./typespecs/denormalized_types";
import { Loading } from "./Loading";
import { NestedObject, NestedObjectPicker } from "./NestedObjectPicker";

type WorkoutCycleDenormalizedEntry = WorkoutCycleDenormalized["entries"][0];

function convertWorkoutCyclesToNestedObject(
  workoutCycles: WorkoutCycleDenormalized[] | undefined,
): NestedObject | undefined {
  if (!workoutCycles) return undefined;
  return {
    kind: "node",
    text: "Workout Cycles",
    children: workoutCycles.map((workoutCycle): NestedObject => {
      const entries = workoutCycle.entries;
      const lastFinishedEntries = workoutCycle.entries.reduce((acc, e) => {
        if (e.last_finished) {
          return acc.concat({
            ...e,
            last_finished: e.last_finished,
          });
        } else {
          return acc;
        }
      }, new Array<Omit<WorkoutCycleDenormalizedEntry, "last_finished"> & { last_finished: Date }>());
      lastFinishedEntries.sort(
        (lhs, rhs) => lhs.last_finished.getTime() - rhs.last_finished.getTime(),
      );
      const latestLastFinishedEntry = lastFinishedEntries.length
        ? lastFinishedEntries.at(-1)
        : undefined;
      const latestLastFinishedIdx =
        latestLastFinishedEntry &&
        entries.findIndex((e) => Object.is(e, latestLastFinishedEntry));
      const highlightedIdx =
        latestLastFinishedIdx === undefined
          ? 0
          : (latestLastFinishedIdx + 1) % entries.length;
      const entryToLastFinished = new Map<WorkoutCycleDenormalizedEntry, Date>(
        lastFinishedEntries.map((x) => [x, x.last_finished]),
      );
      return {
        kind: "node",
        text: workoutCycle.name,
        subtext: workoutCycle.description ?? undefined,
        children: entries.map((entry, idx): NestedObject => {
          const lastFinished = entryToLastFinished.get(entry);
          const subtexts = [];
          if (entry.workout_def.description) {
            subtexts.push(entry.workout_def.description);
          }
          if (lastFinished) {
            subtexts.push(`Last completed on ${lastFinished}`);
          }
          const subtext = subtexts.length ? subtexts.join("\n") : undefined;
          return {
            kind: "leaf",
            text: entry.workout_def.name,
            subtext,
            highlight: idx === highlightedIdx,
            action: () => {
              console.log(`Clicked on workout ${entry.workout_def.name}`);
            },
          };
        }),
      };
    }),
  };
}

export function WorkoutCyclesPicker() {
  const connection = useContext(ConnectionContext);
  const { setError } = useContext(ErrorContext);

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
    wrapAsync(getWorkoutCycles, setError)();
  });

  const workoutCyclesNestedObject = useMemo(
    () => convertWorkoutCyclesToNestedObject(workoutCycles),
    [workoutCycles],
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
