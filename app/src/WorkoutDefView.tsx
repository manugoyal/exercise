import { useMemo } from "react";

import { WorkoutDefDenormalized } from "./typespecs/denormalized_types";
import { NestedObject, NestedObjectPicker } from "./NestedObjectPicker";
import { lastFinishedText } from "./util";
import pluralize from "pluralize";

function convertWorkoutDefToNestedObject(
  workoutDef: WorkoutDefDenormalized,
): NestedObject {
  return {
    kind: "node",
    text: workoutDef.name,
    subtext: [
      workoutDef.description,
      lastFinishedText(workoutDef.last_finished),
    ]
      .filter((x) => !!x)
      .join("\n"),
    children: workoutDef.sets.map(
      (workoutSet, idx): NestedObject => ({
        kind: "node",
        text: workoutSet.name ?? `Set ${idx + 1}`,
        subtext: [
          workoutSet.description,
          pluralize("reps", workoutSet.reps, true),
          workoutSet.transition_time
            ? `Transition time: ${pluralize("seconds", workoutSet.transition_time, true)}`
            : undefined,
        ]
          .filter((x) => !!x)
          .join("\n"),
        children: workoutSet.exercises.map(
          (setExercise): NestedObject => ({
            kind: "node",
            text: [setExercise.exercise.name, setExercise.variant?.name]
              .filter((x) => !!x)
              .join(" - "),
            subtext: [
              setExercise.description,
              pluralize(
                setExercise.limit_type === "reps" ? "rep" : "second",
                setExercise.limit_value,
                true,
              ),
            ]
              .filter((x) => !!x)
              .join("\n"),
            children: setExercise.exercise.description
              ? [
                  {
                    kind: "leaf",
                    text: [
                      setExercise.exercise.description,
                      setExercise.variant?.description,
                    ]
                      .filter((x) => !!x)
                      .join(". "),
                  },
                ]
              : [],
          }),
        ),
      }),
    ),
  };
}

export function WorkoutDefView({
  workoutDef,
}: {
  workoutDef: WorkoutDefDenormalized;
}) {
  const workoutDefNestedObject = useMemo(
    () => convertWorkoutDefToNestedObject(workoutDef),
    [workoutDef],
  );

  return (
    <div>
      <NestedObjectPicker nestedObject={workoutDefNestedObject} />
      <br />
    </div>
  );
}
