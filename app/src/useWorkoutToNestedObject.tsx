import { useCallback, useMemo, useRef, useState } from "react";
import pluralize from "pluralize";
import { z } from "zod";
import { Connection } from "./connection";
import {
  workoutInstanceDenormalizedSchema,
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

function instanceExerciseSetKey(
  workout_set_exercise_def_id: string,
  set_rep: number,
) {
  return JSON.stringify({ workout_set_exercise_def_id, set_rep });
}

type WorkoutSetExerciseInstance =
  WorkoutInstanceDenormalized["set_exercises"][number];

type SetQuantityModalInfo = {
  quantityName: string;
  initialQuantityValue: number | null | undefined;
  setQuantity: (quantity: number) => void;
};

function useSetQuantityModal(key: number) {
  const [quantityName, setQuantityName] = useState<string>("");
  const [quantityValue, setQuantityValue] = useState<string>("");
  const setQuantityRef = useRef<(quantity: number) => void>(() => {});
  const ref = useRef<HTMLDialogElement>(null);
  const onChangeQuantity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setQuantityValue(e.target.value),
    [],
  );

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const quantityInput = formData.get("quantity");
      const result = z.coerce
        .number()
        .nullable()
        .safeParse(quantityInput || null);
      if (!result.success) {
        alert(`Invalid quantity ${quantityInput}`);
        return;
      }
      const newQuantity = result.data;
      if (newQuantity !== null) {
        setQuantityRef.current(newQuantity);
      }
    } finally {
      ref.current?.close();
    }
  }, []);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    ref.current?.close();
  }, []);

  const modal = (
    <dialog key={key} ref={ref}>
      <form onSubmit={handleSubmit}>
        <label>
          Enter {quantityName}:
          <input
            type="number"
            name="quantity"
            value={quantityValue}
            onChange={onChangeQuantity}
          />
        </label>
        <br />
        <button type="submit"> Submit </button>
        <br />
        <button onClick={handleCancel}> Cancel </button>
      </form>
    </dialog>
  );

  const showModal = useCallback((info: SetQuantityModalInfo) => {
    setQuantityName(info.quantityName);
    setQuantityValue(
      info.initialQuantityValue ? String(info.initialQuantityValue) : "",
    );
    setQuantityRef.current = info.setQuantity;
    ref.current?.showModal();
  }, []);

  return { modal, showModal };
}

function collectRelatedWorkoutSetExerciseDefIds({
  workoutInstance,
  instanceEntry,
}: {
  workoutInstance: WorkoutInstanceDenormalized;
  instanceEntry: WorkoutSetExerciseInstance;
}): Set<string> {
  const ret = new Set<string>();
  ret.add(instanceEntry.workout_set_exercise_def_id);

  // Collect all workout exercises.
  const exerciseDefs = workoutInstance.workout_def.sets.flatMap((s) =>
    s.exercises.map((e) => ({ set_id: s.id, e })),
  );
  const thisDef = exerciseDefs.find(
    (x) => x.e.id === instanceEntry.workout_set_exercise_def_id,
  );
  if (!thisDef) {
    throw new Error(
      `Invalid workout instance. Entry ${instanceEntry.id} references nonexistent exercise ${instanceEntry.workout_set_exercise_def_id}`,
    );
  }
  const analogousVariants = ["left side", "right side"];
  exerciseDefs.forEach((x) => {
    if (
      thisDef.set_id === x.set_id &&
      thisDef.e.exercise.id === x.e.exercise.id &&
      thisDef.e.variant &&
      x.e.variant &&
      analogousVariants.includes(thisDef.e.variant.name) &&
      analogousVariants.includes(x.e.variant.name)
    ) {
      ret.add(x.e.id);
    }
  });
  return ret;
}

function collectInstancesToSet({
  workoutInstance,
  instanceEntry,
}: {
  workoutInstance: WorkoutInstanceDenormalized;
  instanceEntry: WorkoutSetExerciseInstance;
}): Set<string> {
  const ret = new Set<string>();
  if (instanceEntry.finished) {
    ret.add(instanceEntry.id);
  } else {
    // Collect all unfinished instances which have a related
    // workout_set_exercise_def_id and >= setRep.
    const relatedWorkoutSetExerciseDefIds =
      collectRelatedWorkoutSetExerciseDefIds({
        workoutInstance,
        instanceEntry,
      });
    for (const entry of workoutInstance.set_exercises) {
      if (
        !entry.finished &&
        relatedWorkoutSetExerciseDefIds.has(
          entry.workout_set_exercise_def_id,
        ) &&
        entry.set_rep >= instanceEntry.set_rep
      ) {
        ret.add(entry.id);
      }
    }
  }
  return ret;
}

async function refetchWorkoutInstance({
  id,
  replaceData,
  connection,
}: {
  id: string;
  replaceData: (data: WorkoutInstanceDenormalized) => void;
  connection: Connection;
}): Promise<void> {
  const newWorkoutInstance = workoutInstanceDenormalizedSchema.parse(
    await connection.runRpc("get_workout_instance", {
      _auth_id: connection.auth_id,
      _id: id,
    }),
  );
  replaceData(newWorkoutInstance);
}

async function runSetQuantity({
  workoutInstance,
  instanceEntry,
  replaceData,
  connection,
  quantityKey,
  quantityValue,
}: {
  workoutInstance: WorkoutInstanceDenormalized;
  instanceEntry: WorkoutSetExerciseInstance;
  replaceData: (data: WorkoutInstanceDenormalized) => void;
  connection: Connection;
  quantityKey: string;
  quantityValue: number;
}) {
  const instanceIdsToSet = collectInstancesToSet({
    workoutInstance,
    instanceEntry,
  });
  await Promise.all(
    [...instanceIdsToSet.values()].map((instanceId) =>
      connection.runRpc("patch_workout_set_exercise_instance", {
        _auth_id: connection.auth_id,
        _workout_set_exercise_instance_id: instanceId,
        [quantityKey]: quantityValue,
      }),
    ),
  );
  refetchWorkoutInstance({ id: workoutInstance.id, replaceData, connection });
}

export function useWorkoutToNestedObject({
  type,
  data,
  replaceData,
  connection,
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
) & { connection?: Connection }): {
  nestedObject: NestedObject;
  modals: React.ReactNode[];
} {
  const workoutDef = useMemo(
    (): WorkoutDefDenormalized =>
      type === "workout_def" ? data : data.workout_def,
    [data, type],
  );
  const workoutInstanceEntries = useMemo(
    () =>
      type === "workout_instance"
        ? new Map<string, WorkoutSetExerciseInstance>(
            data.set_exercises.map((e) => [
              instanceExerciseSetKey(e.workout_set_exercise_def_id, e.set_rep),
              e,
            ]),
          )
        : undefined,
    [data, type],
  );

  const { modal: setQuantityModal, showModal: showSetQuantityModal } =
    useSetQuantityModal(0);

  const modals: React.ReactNode[] = [setQuantityModal];

  const nestedObject = useMemo(
    (): NestedObject => ({
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
            pluralize("rep", workoutSet.reps, true),
            workoutSet.transition_time
              ? `Transition time: ${pluralize("second", workoutSet.transition_time, true)}`
              : undefined,
          ]
            .filter((x) => !!x)
            .join("\n"),
          children: (type === "workout_def"
            ? cartesianProduct([undefined], workoutSet.exercises)
            : cartesianProduct(
                Array.from({ length: workoutSet.reps }).map(
                  (_, idx) => idx + 1,
                ),
                workoutSet.exercises,
              )
          ).map(([setRepIdx, setExercise]): NestedObject => {
            const instanceEntry = (() => {
              if (!(setRepIdx && workoutInstanceEntries)) {
                return undefined;
              }
              return workoutInstanceEntries.get(
                instanceExerciseSetKey(setExercise.id, setRepIdx),
              );
            })();
            const isReps = setExercise.limit_type === "reps";
            return {
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
                instanceEntry?.weight_lbs
                  ? pluralize("lb", instanceEntry.weight_lbs, true)
                  : undefined,
                pluralize(
                  isReps ? "rep" : "second",
                  instanceEntry?.limit_value ?? setExercise.limit_value,
                  true,
                ),
                instanceEntry?.description &&
                  `Exercise notes: ${instanceEntry.description}`,
              ]
                .filter((x) => !!x)
                .join("\n"),
              children: [
                ...(setExercise.exercise.description
                  ? [
                      {
                        kind: "leaf",
                        text: [
                          setExercise.exercise.description,
                          setExercise.variant?.description,
                        ]
                          .filter((x) => !!x)
                          .join(" - "),
                      } as const,
                    ]
                  : []),
                ...(type === "workout_instance" && instanceEntry && connection
                  ? [
                      {
                        kind: "leaf",
                        text: "Set weight",
                        action: () =>
                          showSetQuantityModal({
                            quantityName: "weight (lbs)",
                            initialQuantityValue: instanceEntry.weight_lbs,
                            setQuantity: (quantityValue) =>
                              runSetQuantity({
                                workoutInstance: data,
                                instanceEntry,
                                replaceData,
                                connection,
                                quantityKey: "_weight_lbs",
                                quantityValue,
                              }),
                          }),
                      } as const,
                      {
                        kind: "leaf",
                        text: `Set ${isReps ? "reps" : "time"}`,
                        action: () =>
                          showSetQuantityModal({
                            quantityName: isReps ? "reps" : "time (seconds)",
                            initialQuantityValue: instanceEntry.limit_value,
                            setQuantity: (quantityValue) =>
                              runSetQuantity({
                                workoutInstance: data,
                                instanceEntry,
                                replaceData,
                                connection,
                                quantityKey: "_limit_value",
                                quantityValue,
                              }),
                          }),
                      } as const,
                      {
                        kind: "leaf",
                        text: `Set exercise notes`,
                        action: async () => {
                          const description = prompt(
                            "Enter exercise notes",
                            instanceEntry.description ?? "",
                          );
                          if (description == null) return;
                          const newWorkoutInstance =
                            workoutInstanceDenormalizedSchema.parse(
                              await connection.runRpc(
                                "patch_workout_set_exercise_instance",
                                {
                                  _auth_id: connection.auth_id,
                                  _workout_set_exercise_instance_id:
                                    instanceEntry.id,
                                  _description: description,
                                },
                              ),
                            );
                          replaceData(newWorkoutInstance);
                        },
                      } as const,
                    ]
                  : []),
              ],
            };
          }),
        }),
      ),
    }),
    [
      type,
      data,
      replaceData,
      connection,
      workoutDef,
      workoutInstanceEntries,
      showSetQuantityModal,
    ],
  );

  return { nestedObject, modals };
}
