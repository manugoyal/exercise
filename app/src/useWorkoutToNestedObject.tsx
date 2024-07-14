import { useContext, useMemo } from "react";
import pluralize from "pluralize";
import { NavStateContext } from "./navState";
import { Connection } from "./connection";
import { Variant } from "./typespecs/db_types";
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
import { useSetQuantityModal } from "./useSetQuantityModal";
import { PlaythroughExerciseInitialStateEntry } from "./playthroughTypes";

function instanceExerciseSetKey(
  workout_block_exercise_def_id: string,
  set_num: number,
) {
  return JSON.stringify({ workout_block_exercise_def_id, set_num });
}

type WorkoutBlockExercise =
  WorkoutDefDenormalized["blocks"][number]["exercises"][number];

type WorkoutBlockExerciseInstance =
  WorkoutInstanceDenormalized["block_exercises"][number];

function collectRelatedWorkoutBlockExerciseDefIds({
  workoutInstance,
  instanceEntry,
}: {
  workoutInstance: WorkoutInstanceDenormalized;
  instanceEntry: WorkoutBlockExerciseInstance;
}): Set<string> {
  const ret = new Set<string>();
  ret.add(instanceEntry.workout_block_exercise_def_id);

  // Collect all workout exercises.
  const exerciseDefs = workoutInstance.workout_def.blocks.flatMap((b) =>
    b.exercises.map((e) => ({ block_id: b.id, e })),
  );
  const thisDef = exerciseDefs.find(
    (x) => x.e.id === instanceEntry.workout_block_exercise_def_id,
  );
  if (!thisDef) {
    throw new Error(
      `Invalid workout instance. Entry ${instanceEntry.id} references nonexistent exercise ${instanceEntry.workout_block_exercise_def_id}`,
    );
  }
  const ignoreVariantNames = new Set<string>(["left side", "right side"]);
  function variantsKey(variants: Variant[]): string {
    const ids = variants
      .filter((v) => !ignoreVariantNames.has(v.name))
      .map((v) => v.id);
    ids.sort();
    return ids.join(",");
  }
  exerciseDefs.forEach((x) => {
    if (
      thisDef.block_id === x.block_id &&
      thisDef.e.exercise.id === x.e.exercise.id &&
      variantsKey(thisDef.e.variants) === variantsKey(x.e.variants)
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
  instanceEntry: WorkoutBlockExerciseInstance;
}): Set<string> {
  const ret = new Set<string>();
  if (instanceEntry.finished) {
    ret.add(instanceEntry.id);
  } else {
    // Collect all unfinished instances which have a related
    // workout_block_exercise_def_id and >= setNum.
    const relatedWorkoutBlockExerciseDefIds =
      collectRelatedWorkoutBlockExerciseDefIds({
        workoutInstance,
        instanceEntry,
      });
    for (const entry of workoutInstance.block_exercises) {
      if (
        !entry.finished &&
        relatedWorkoutBlockExerciseDefIds.has(
          entry.workout_block_exercise_def_id,
        ) &&
        entry.set_num >= instanceEntry.set_num
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
  instanceEntry: WorkoutBlockExerciseInstance;
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
      connection.runRpc("patch_workout_block_exercise_instance", {
        _auth_id: connection.auth_id,
        _workout_block_exercise_instance_id: instanceId,
        [quantityKey]: quantityValue,
      }),
    ),
  );
  refetchWorkoutInstance({ id: workoutInstance.id, replaceData, connection });
}

function enumerateBlockExercises(
  exercises: WorkoutBlockExercise[],
): [WorkoutBlockExercise, number][] {
  return exercises.map((e, idx) => [e, idx]);
}

function totalTimeSpentInWorkout(
  instances: WorkoutBlockExerciseInstance[],
): number {
  return instances.reduce((total, instance) => {
    return (
      total +
      (instance.started && instance.finished
        ? (instance.finished.getTime() - instance.started.getTime()) / 1000 -
          (instance?.paused_time_s ?? 0)
        : 0)
    );
  }, 0);
}

export function useWorkoutToNestedObject({
  type,
  data,
  replaceData,
  resumeWorkoutAtInstance,
  autoExpandEntry,
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
) & {
  resumeWorkoutAtInstance?: (
    entry: PlaythroughExerciseInitialStateEntry,
  ) => void;
  autoExpandEntry?: PlaythroughExerciseInitialStateEntry;
  connection?: Connection;
}): {
  nestedObject: NestedObject;
  modals: React.ReactNode[];
} {
  const { pushNavState } = useContext(NavStateContext);

  const workoutDef = useMemo(
    (): WorkoutDefDenormalized =>
      type === "workout_def" ? data : data.workout_def,
    [data, type],
  );
  const workoutInstanceEntries = useMemo(
    () =>
      type === "workout_instance"
        ? new Map<string, WorkoutBlockExerciseInstance>(
            data.block_exercises.map((e) => [
              instanceExerciseSetKey(
                e.workout_block_exercise_def_id,
                e.set_num,
              ),
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
        ((): string => {
          if (type !== "workout_instance") {
            return "";
          }
          const totalTime = totalTimeSpentInWorkout(data.block_exercises);
          return totalTime
            ? `Total time spent in workout: ${pluralize("seconds", totalTime, true)}`
            : "";
        })(),
        type === "workout_instance" && instanceNotesText(data.description),
      ]
        .filter((x) => !!x)
        .join("\n"),
      children: workoutDef.blocks.map(
        (block, blockIdx): NestedObject => ({
          kind: "node",
          text: block.name ?? `Block ${blockIdx + 1}`,
          subtext: [
            block.description,
            pluralize("set", block.sets, true),
            block.transition_time
              ? `Transition time: ${pluralize("second", block.transition_time, true)}`
              : undefined,
          ]
            .filter((x) => !!x)
            .join("\n"),
          children: (type === "workout_def"
            ? cartesianProduct(
                [undefined],
                enumerateBlockExercises(block.exercises),
              )
            : cartesianProduct(
                Array.from({ length: block.sets }).map((_, idx) => idx + 1),
                enumerateBlockExercises(block.exercises),
              )
          ).map(([setNum, [blockExercise, blockExerciseIdx]]): NestedObject => {
            const instanceEntry = (() => {
              if (!(setNum && workoutInstanceEntries)) {
                return undefined;
              }
              return workoutInstanceEntries.get(
                instanceExerciseSetKey(blockExercise.id, setNum),
              );
            })();
            const isReps = blockExercise.limit_type === "reps";
            return {
              kind: "node",
              text: [
                setNum && `Set ${setNum}`,
                blockExercise.exercise.name,
                ...blockExercise.variants.map((x) => x.name),
              ]
                .filter((x) => !!x)
                .join(" - "),
              subtext: [
                blockExercise.description,
                instanceEntry?.weight_lbs
                  ? pluralize("lb", instanceEntry.weight_lbs, true)
                  : undefined,
                pluralize(
                  isReps ? "rep" : "second",
                  instanceEntry?.limit_value ?? blockExercise.limit_value,
                  true,
                ),
                instanceEntry?.description &&
                  `Exercise notes: ${instanceEntry.description}`,
                instanceEntry?.started &&
                  instanceEntry?.finished &&
                  `Completed in ${pluralize("seconds", (instanceEntry.finished.getTime() - instanceEntry.started.getTime()) / 1000 - (instanceEntry?.paused_time_s ?? 0), true)}`,
              ]
                .filter((x) => !!x)
                .join("\n"),
              children: [
                ...(blockExercise.exercise.description
                  ? [
                      {
                        kind: "leaf",
                        text: [
                          blockExercise.exercise.description,
                          ...blockExercise.variants.map((x) => x.description),
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
                                "patch_workout_block_exercise_instance",
                                {
                                  _auth_id: connection.auth_id,
                                  _workout_block_exercise_instance_id:
                                    instanceEntry.id,
                                  _description: description,
                                },
                              ),
                            );
                          replaceData(newWorkoutInstance);
                        },
                      } as const,
                      {
                        kind: "leaf",
                        text: `View exercise history`,
                        action: () => {
                          pushNavState({
                            status: "view_exercise_history",
                            data: {
                              def: blockExercise,
                              instance: instanceEntry,
                            },
                          });
                        },
                      } as const,
                    ]
                  : []),
                ...(type === "workout_instance" &&
                instanceEntry &&
                resumeWorkoutAtInstance
                  ? [
                      {
                        kind: "leaf",
                        text: `Resume workout from here`,
                        action: () => {
                          resumeWorkoutAtInstance({
                            workout_block_idx: blockIdx,
                            block_exercise_idx: blockExerciseIdx,
                            instance: { id: instanceEntry.id },
                          });
                        },
                      } as const,
                    ]
                  : []),
              ],
              highlight:
                autoExpandEntry &&
                instanceEntry &&
                instanceEntry.id === autoExpandEntry.instance.id,
            };
          }),
          highlight:
            autoExpandEntry && blockIdx === autoExpandEntry.workout_block_idx,
        }),
      ),
    }),
    [
      workoutDef.name,
      workoutDef.description,
      workoutDef.last_finished,
      workoutDef.blocks,
      type,
      data,
      autoExpandEntry,
      connection,
      resumeWorkoutAtInstance,
      workoutInstanceEntries,
      showSetQuantityModal,
      replaceData,
      pushNavState,
    ],
  );

  return { nestedObject, modals };
}
