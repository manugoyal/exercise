import pluralize from "pluralize";
import { useContext, useEffect, useMemo, useState } from "react";
import { ConnectionContext } from "./connection";
import {
  WorkoutInstanceDenormalized,
  WorkoutDefDenormalized,
} from "./typespecs/denormalized_types";
import {
  ExerciseHistoryEntry,
  exerciseHistoryEntrySchema,
} from "./typespecs/app_types";
import { Loading } from "./Loading";

export function ExerciseHistoryView({
  def,
  instance,
}: {
  def: WorkoutDefDenormalized["blocks"][number]["exercises"][number];
  instance: WorkoutInstanceDenormalized["block_exercises"][number];
}) {
  const connection = useContext(ConnectionContext);

  const [exerciseHistory, setExerciseHistory] = useState<
    ExerciseHistoryEntry[] | undefined
  >(undefined);

  useEffect(() => {
    if (exerciseHistory !== undefined) {
      return;
    }

    async function getExerciseHistory() {
      const result = exerciseHistoryEntrySchema.array().parse(
        await connection.runRpc("get_exercise_history", {
          _auth_id: connection.auth_id,
          _workout_block_exercise_instance_id: instance.id,
        }),
      );
      setExerciseHistory(result);
    }
    getExerciseHistory();
  });

  const historyEntries = useMemo((): { text: string; subtext: string }[] => {
    if (exerciseHistory === undefined) {
      return [];
    }

    const sortedEntries = [...exerciseHistory];
    sortedEntries.sort((lhs, rhs) => {
      if (!(lhs.instance.finished && rhs.instance.finished)) {
        throw new Error("Impossible: exercise history entry is unfinished");
      }
      return lhs.instance.finished.getTime() < rhs.instance.finished.getTime()
        ? 1
        : -1;
    });

    return sortedEntries.map(({ def, instance }) => {
      if (!instance.finished) {
        throw new Error("Impossible");
      }
      return {
        text: [
          instance.finished.toLocaleString(),
          pluralize(
            def.limit_type === "reps" ? "reps" : "seconds",
            instance.limit_value,
            true,
          ),
          instance.weight_lbs
            ? pluralize("lbs", instance.weight_lbs, true)
            : undefined,
        ]
          .filter((x) => !!x)
          .join(" - "),
        subtext: [
          def.description && `Exercise notes: ${def.description}`,
          instance.description && `Instance notes: ${instance.description}`,
        ]
          .filter((x) => !!x)
          .join("\n"),
      };
    });
  }, [exerciseHistory]);

  const titleText = useMemo(
    () =>
      [def.exercise.name, ...def.variants.map((x) => x.name)]
        .filter((x) => !!x)
        .join(" - "),
    [def.exercise.name, def.variants],
  );

  const titleSubtext = useMemo(
    () =>
      [def.exercise.description, ...def.variants.map((x) => x.description)]
        .filter((x) => !!x)
        .join(" - "),
    [def.exercise.description, def.variants],
  );

  const historyEntriesUl = (
    <ul>
      {historyEntries.map((x, idx) => (
        <li key={idx}>
          <p>{x.text}</p>
          {x.subtext ? <small>{x.subtext}</small> : null}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <h1> {titleText} </h1>
      {titleSubtext && <p> {titleSubtext} </p>}
      {exerciseHistory === undefined ? (
        <Loading />
      ) : historyEntries.length === 0 ? (
        <div> No exercise history </div>
      ) : (
        historyEntriesUl
      )}
      <br />
      <button onClick={() => setExerciseHistory(undefined)}> Reload </button>
    </>
  );
}
