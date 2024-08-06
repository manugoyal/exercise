import { useCallback, useContext, useEffect, useMemo } from "react";
import pluralize from "pluralize";
import { ConnectionContext } from "./connection";
import { NavState, NavStateContext } from "./navState";
import { sortWorkoutInstanceDenormalized } from "./sortedWorkoutInstanceDenormalized";
import { bark } from "./bark";
import {
  PlaythroughState,
  getPlaythroughExerciseInitialState,
} from "./playthroughTypes";
import { useSetQuantityModal } from "./useSetQuantityModal";
import { workoutInstanceDenormalizedSchema } from "./typespecs/denormalized_types";
import { DEFAULT_TRANSITION_TIME_S } from "./constants";

export function WorkoutInstancePlaythrough({
  playthroughState,
}: {
  playthroughState: PlaythroughState;
}) {
  const { workout, workout_block_exercise_instance_id, phase, timerEntries } =
    playthroughState;
  if (timerEntries.length === 0) {
    throw new Error("timerEntries should not be empty");
  }
  const isPaused = useMemo(
    () => timerEntries[timerEntries.length - 1].type === "pause",
    [timerEntries],
  );
  const { pushNavState, replaceNavState } = useContext(NavStateContext);
  const connection = useContext(ConnectionContext);

  const updatePlaythroughState = useCallback(
    (fn: (current: PlaythroughState) => PlaythroughState) => {
      replaceNavState((current: NavState) => {
        if (current.status !== "playthrough_workout_instance") {
          throw new Error("Impossible");
        }
        return {
          status: "playthrough_workout_instance",
          data: { playthroughState: fn(current.data.playthroughState) },
        };
      });
    },
    [replaceNavState],
  );

  const { sortedEntries, entryIdToSortedEntryIdx } = useMemo(
    () => sortWorkoutInstanceDenormalized(workout),
    [workout],
  );
  const entryIdx = entryIdToSortedEntryIdx.get(
    workout_block_exercise_instance_id,
  );
  if (entryIdx === undefined) {
    throw new Error(
      `Unknown instance id ${workout_block_exercise_instance_id} in workout instance ${workout.id}`,
    );
  }
  const { instance, workout_block_idx, block_exercise_idx } =
    sortedEntries[entryIdx];
  const workoutBlock = workout.workout_def.blocks[workout_block_idx];
  const blockExercise = workoutBlock.exercises[block_exercise_idx];
  const isReps = blockExercise.limit_type === "reps";

  const getTimeRemaining = useCallback(() => {
    const tailState = { lastEntry: timerEntries[0], elapsedTimeMs: 0 };
    timerEntries
      .slice(1)
      .concat([{ type: "resume", time: new Date() }])
      .forEach((e) => {
        if (tailState.lastEntry.type === "resume") {
          tailState.elapsedTimeMs +=
            e.time.getTime() - tailState.lastEntry.time.getTime();
        }
        tailState.lastEntry = e;
      });
    const elapsedTime = tailState.elapsedTimeMs / 1000;
    if (phase === "transition") {
      return Math.ceil(
        (workoutBlock.transition_time ?? DEFAULT_TRANSITION_TIME_S) -
          elapsedTime,
      );
    } else if (blockExercise.limit_type === "reps") {
      return undefined;
    } else {
      return Math.ceil(instance.limit_value - elapsedTime);
    }
  }, [
    instance.limit_value,
    phase,
    blockExercise.limit_type,
    timerEntries,
    workoutBlock.transition_time,
  ]);

  const advancePhase = useCallback(async () => {
    bark();
    if (phase === "transition") {
      updatePlaythroughState((current: PlaythroughState) => ({
        ...current,
        phase: "play",
        timerEntries: [{ type: "resume", time: new Date() }],
      }));
      return;
    }
    // Mark this exercise as finished. If we're moving to the next exercise,
    // don't wait for the metadata update of our current instance to complete
    // before advancing.
    const finishCurrentExercisePromise = (async () => {
      try {
        // Figure out the start time and total paused time of this exercise.
        const tailState = { lastEntry: timerEntries[0], pausedTimeMs: 0 };
        let startTime: Date | undefined =
          tailState.lastEntry.type === "resume"
            ? tailState.lastEntry.time
            : undefined;
        timerEntries.slice(1).forEach((e) => {
          if (!startTime && e.type === "resume") {
            startTime = e.time;
          }
          if (tailState.lastEntry.type === "pause") {
            tailState.pausedTimeMs +=
              e.time.getTime() - tailState.lastEntry.time.getTime();
          }
          tailState.lastEntry = e;
        });
        if (startTime === undefined) {
          throw new Error("Impossible: no timer entries");
        }
        await connection.runRpc("patch_workout_block_exercise_instance", {
          _auth_id: connection.auth_id,
          _workout_block_exercise_instance_id: instance.id,
          _started: startTime,
          _finished: new Date(),
          _paused_time_s: tailState.pausedTimeMs / 1000,
        });
      } catch (e) {
        console.error("Failed to update workout exercise instance times\n", e);
      }
    })();
    if (entryIdx + 1 >= sortedEntries.length) {
      // We've finished the workout. Wait for everything to finish before
      // returning back to the workout view.
      await Promise.all([
        finishCurrentExercisePromise,
        connection.runRpc("patch_workout_instance", {
          _auth_id: connection.auth_id,
          _workout_instance_id: workout.id,
          _finished: new Date(),
        }),
      ]);
      replaceNavState({
        status: "view_workout_instance",
        data: { workoutInstanceId: workout.id },
      });
    } else {
      // Go straight to the next exercise.
      updatePlaythroughState((current: PlaythroughState) =>
        getPlaythroughExerciseInitialState({
          workout: current.workout,
          entry: sortedEntries[entryIdx + 1],
        }),
      );
    }
  }, [
    connection,
    entryIdx,
    instance.id,
    phase,
    replaceNavState,
    sortedEntries,
    timerEntries,
    updatePlaythroughState,
    workout.id,
  ]);

  const updateTimer = useCallback(
    (mode: "pause" | "resume" | "toggle") => {
      const entryType =
        mode === "pause"
          ? "pause"
          : mode === "resume"
            ? "resume"
            : isPaused
              ? "resume"
              : "pause";
      updatePlaythroughState((current: PlaythroughState) => ({
        ...current,
        timerEntries: current.timerEntries.concat([
          { type: entryType, time: new Date() },
        ]),
      }));
    },
    [isPaused, updatePlaythroughState],
  );

  const { modal: setQuantityModal, showModal: showSetQuantityModal } =
    useSetQuantityModal(0);

  const setQuantity = useCallback(
    ({
      quantityName,
      initialQuantityValue,
      quantityKey,
    }: {
      quantityName: string;
      initialQuantityValue: number;
      quantityKey: string;
    }) => {
      updateTimer("pause");
      showSetQuantityModal({
        quantityName,
        initialQuantityValue,
        setQuantity: async (quantityValue) => {
          const newWorkoutInstance = workoutInstanceDenormalizedSchema.parse(
            await connection.runRpc("patch_workout_block_exercise_instance", {
              _auth_id: connection.auth_id,
              _workout_block_exercise_instance_id: instance.id,
              [quantityKey]: quantityValue,
            }),
          );
          updatePlaythroughState((current: PlaythroughState) => ({
            ...current,
            workout: newWorkoutInstance,
          }));
        },
      });
    },
    [
      connection,
      instance.id,
      showSetQuantityModal,
      updatePlaythroughState,
      updateTimer,
    ],
  );

  const setWeight = useCallback(
    () =>
      setQuantity({
        quantityName: "weight (lbs)",
        initialQuantityValue: instance.weight_lbs,
        quantityKey: "_weight_lbs",
      }),
    [instance.weight_lbs, setQuantity],
  );

  const setLimitValue = useCallback(
    () =>
      setQuantity({
        quantityName: isReps ? "reps" : "time (seconds)",
        initialQuantityValue: instance.limit_value,
        quantityKey: "_limit_value",
      }),
    [instance.limit_value, isReps, setQuantity],
  );

  const setExerciseNotes = useCallback(async () => {
    updateTimer("pause");
    const description = prompt(
      "Enter exercise notes",
      instance.description ?? "",
    );
    if (description == null) return;
    const newWorkoutInstance = workoutInstanceDenormalizedSchema.parse(
      await connection.runRpc("patch_workout_block_exercise_instance", {
        _auth_id: connection.auth_id,
        _workout_block_exercise_instance_id: instance.id,
        _description: description,
      }),
    );
    updatePlaythroughState((current: PlaythroughState) => ({
      ...current,
      workout: newWorkoutInstance,
    }));
  }, [
    connection,
    instance.description,
    instance.id,
    updatePlaythroughState,
    updateTimer,
  ]);

  const viewExerciseHistory = useCallback(() => {
    updateTimer("pause");
    pushNavState({
      status: "view_exercise_history",
      data: {
        def: blockExercise,
        instance,
      },
    });
  }, [blockExercise, instance, pushNavState, updateTimer]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const timeRemaining = getTimeRemaining();
      if (timeRemaining !== undefined && timeRemaining <= 0) {
        advancePhase();
      } else {
        // Force-update the state to force a refresh of the component display.
        updatePlaythroughState((current: PlaythroughState) => ({ ...current }));
      }
    }, 50);
    return () => clearInterval(intervalId);
  }, [
    advancePhase,
    getTimeRemaining,
    phase,
    replaceNavState,
    updatePlaythroughState,
  ]);

  // Don't wrap this in a useMemo so that it's recomputed on every re-render.
  const phaseText = [
    phase === "transition" ? "Get Ready" : "Go",
    blockExercise.exercise.name,
    ...blockExercise.variants.map((x) => x.name),
  ]
    .filter((x) => !!x)
    .join(" - ");

  const blockExerciseDescription = [
    blockExercise.description,
    blockExercise.exercise.description,
    ...blockExercise.variants.map((x) => x.description),
  ]
    .filter((x) => !!x)
    .join("\n");

  return (
    <>
      {setQuantityModal}
      <div>
        <h1>{phaseText}</h1>
        <h2>
          {[
            instance.weight_lbs
              ? `${pluralize("lbs", instance.weight_lbs, true)}`
              : "",
            blockExercise.limit_type === "reps" &&
              `${pluralize("Rep", instance.limit_value, true)}`,
            (blockExercise.limit_type === "time_s" || phase === "transition") &&
              `${pluralize("Second", getTimeRemaining(), true)}`,
          ]
            .filter((x) => !!x)
            .join(" - ")}
        </h2>
        {blockExerciseDescription ? <p>{blockExerciseDescription}</p> : null}
        {instance.description ? (
          <p>{`Instance notes: ${instance.description}`}</p>
        ) : null}
        <h3>
          {" "}
          {[
            workout.workout_def.name,
            workoutBlock.name ?? `block ${workout_block_idx + 1}`,
            `set ${instance.set_num} / ${workoutBlock.sets}`,
          ].join(" - ")}{" "}
        </h3>
        <p>
          {[
            workoutBlock.description &&
              `Block description: ${workoutBlock.description}`,
            workout.workout_def.description &&
              `Workout description: ${workout.workout_def.description}`,
          ]
            .filter((x) => !!x)
            .join("\n")}
        </p>
        <br />
        <br />
        <button onClick={() => updateTimer("toggle")}>
          {" "}
          {isPaused ? "Resume" : "Pause"}{" "}
        </button>
        <br />
        <button onClick={advancePhase}> Next exercise </button>
        <br />
        <br />
        <br />
        <br />
        <button onClick={setWeight}> Set weight </button>
        <br />
        <button onClick={setLimitValue}>
          {" "}
          Set {isReps ? "reps" : "time"}{" "}
        </button>
        <br />
        <button onClick={setExerciseNotes}> Set exercise notes </button>
        <br />
        <button onClick={viewExerciseHistory}> View exercise history </button>
        <br />
        <br />
        <br />
        <br />
      </div>
    </>
  );
}
