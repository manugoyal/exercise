import { useContext, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { ConnectionContext } from "./connection";
import { ErrorContext, wrapAsync } from "./errorContext";
import { Loading } from "./Loading";
import { NestedObject, NestedObjectPicker } from "./NestedObjectPicker";

const getWorkoutCyclesOutputSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullish(),
    entries: z
      .object({
        ordinal: z.number().int(),
        workout_def_id: z.string(),
        name: z.string(),
        description: z.string().nullish(),
        last_finished: z.string().datetime().nullish(),
      })
      .array(),
  })
  .array();

type GetWorkoutCyclesOutput = z.infer<typeof getWorkoutCyclesOutputSchema>;
type GetWorkoutCyclesOutputEntry = GetWorkoutCyclesOutput[0]["entries"][0];

function convertWorkoutCyclesToNestedObject(
  workoutCycles: GetWorkoutCyclesOutput | undefined,
): NestedObject | undefined {
  if (!workoutCycles) return undefined;
  return {
    kind: "node",
    text: "Workout Cycles",
    children: workoutCycles.map((workoutCycle): NestedObject => {
      const sortedEntries = [...workoutCycle.entries];
      sortedEntries.sort((lhs, rhs) => lhs.ordinal - rhs.ordinal);
      const lastFinishedEntries = workoutCycle.entries.reduce((acc, e) => {
        if (e.last_finished) {
          return acc.concat({
            entry: e,
            last_finished: new Date(e.last_finished),
          });
        } else {
          return acc;
        }
      }, new Array<{ entry: GetWorkoutCyclesOutputEntry; last_finished: Date }>());
      lastFinishedEntries.sort(
        (lhs, rhs) => lhs.last_finished.getTime() - rhs.last_finished.getTime(),
      );
      const latestLastFinishedEntry = lastFinishedEntries.length
        ? lastFinishedEntries.at(-1)
        : undefined;
      const latestLastFinishedSortedIdx =
        latestLastFinishedEntry &&
        sortedEntries.findIndex((e) =>
          Object.is(e, latestLastFinishedEntry.entry),
        );
      const highlightedIdx =
        latestLastFinishedSortedIdx === undefined
          ? 0
          : (latestLastFinishedSortedIdx + 1) % sortedEntries.length;
      const entryToLastFinished = new Map<GetWorkoutCyclesOutputEntry, Date>(
        lastFinishedEntries.map((x) => [x.entry, x.last_finished]),
      );
      return {
        kind: "node",
        text: workoutCycle.name,
        subtext: workoutCycle.description ?? undefined,
        children: sortedEntries.map((entry, idx): NestedObject => {
          const lastFinished = entryToLastFinished.get(entry);
          const subtexts = [];
          if (entry.description) {
            subtexts.push(entry.description);
          }
          if (lastFinished) {
            subtexts.push(`Last completed on ${lastFinished}`);
          }
          const subtext = subtexts.length ? subtexts.join("\n") : undefined;
          return {
            kind: "leaf",
            text: entry.name,
            subtext,
            highlight: idx === highlightedIdx,
            action: () => {
              console.log(`Clicked on workout ${entry.name}`);
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

  const [getWorkoutCyclesOutput, setGetWorkoutCyclesOutput] = useState<
    GetWorkoutCyclesOutput | undefined
  >(undefined);

  useEffect(() => {
    if (getWorkoutCyclesOutput !== undefined) {
      return;
    }

    async function getWorkoutCycles() {
      const result = getWorkoutCyclesOutputSchema.parse(
        await connection.runRpc("get_workout_cycles", {
          _auth_id: connection.auth_id,
        }),
      );
      setGetWorkoutCyclesOutput(result);
    }
    wrapAsync(getWorkoutCycles, setError)();
  });

  const workoutCyclesNestedObject = useMemo(
    () => convertWorkoutCyclesToNestedObject(getWorkoutCyclesOutput),
    [getWorkoutCyclesOutput],
  );

  if (!workoutCyclesNestedObject) {
    return <Loading />;
  }

  return (
    <div>
      <NestedObjectPicker nestedObject={workoutCyclesNestedObject} />
      <br />
      <button onClick={() => setGetWorkoutCyclesOutput(undefined)}>
        {" "}
        Reload{" "}
      </button>
    </div>
  );
}
