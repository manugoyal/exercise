import { Connection } from "./connection";
import {
  WorkoutInstanceDenormalized,
  WorkoutDefDenormalized,
} from "./typespecs/denormalized_types";
import { NestedObject } from "./NestedObjectPicker";
import {
  cartesianProduct,
  instanceNotesText,
  startedOnText,
  finishedOnText,
  lastFinishedText,
} from "./util";
import pluralize from "pluralize";

function instanceExerciseSetKey(
  workout_set_exercise_def_id: string,
  set_rep: number,
) {
  return JSON.stringify({ workout_set_exercise_def_id, set_rep });
}

type WorkoutSetExerciseInstance =
  WorkoutInstanceDenormalized["set_exercises"][number];

export function workoutToNestedObject({
  type,
  data,
}: (
  | {
      type: "workout_def";
      data: WorkoutDefDenormalized;
      replaceData?: undefined;
    }
  | {
      type: "workout_instance";
      data: WorkoutInstanceDenormalized;
      replaceData: (data: WorkoutInstanceDenormalized) => void;
    }
) & { connection?: Connection }): NestedObject {
  const workoutDef = type === "workout_def" ? data : data.workout_def;
  const workoutInstanceEntries =
    type === "workout_instance"
      ? new Map<string, WorkoutSetExerciseInstance>(
          data.set_exercises.map((e) => [
            instanceExerciseSetKey(e.id, e.set_rep),
            e,
          ]),
        )
      : undefined;
  if (workoutInstanceEntries) {
    console.log("Yo");
  }
  return {
    kind: "node",
    text: workoutDef.name,
    subtext: [
      workoutDef.description,
      type === "workout_def" && lastFinishedText(workoutDef.last_finished),
      type === "workout_instance" && startedOnText(data.started),
      type === "workout_instance" && finishedOnText(data.finished),
      type === "workout_instance" && instanceNotesText(data.description),
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
        children: (type === "workout_def"
          ? cartesianProduct([undefined], workoutSet.exercises)
          : cartesianProduct(
              Array.from({ length: workoutSet.reps }).map((_, idx) => idx + 1),
              workoutSet.exercises,
            )
        ).map(
          ([setRepIdx, setExercise]): NestedObject => ({
            kind: "node",
            text: [
              setRepIdx && `Set ${setRepIdx}`,
              setExercise.exercise.name,
              setExercise.variant?.name,
            ]
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
