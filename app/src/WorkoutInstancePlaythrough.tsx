import { useCallback, useContext, useEffect, useMemo } from "react";
import pluralize from "pluralize";
import {
  NavStateContext,
  NavStatePlaythroughWorkoutInstance,
} from "./navState";
import { sortWorkoutInstanceDenormalized } from "./sortedWorkoutInstanceDenormalized";
import { bark } from "./bark";
import { getPlaythroughExerciseInitialState } from "./playthroughTypes";

export function WorkoutInstancePlaythrough(props: {
  data: NavStatePlaythroughWorkoutInstance["data"];
}) {
  const { workout, workout_block_exercise_instance_id, phase, timerEntries } =
    props.data;
  if (timerEntries.length === 0) {
    throw new Error("timerEntries should not be empty");
  }
  const isPaused = useMemo(
    () => timerEntries[timerEntries.length - 1].type === "pause",
    [timerEntries],
  );
  const { replaceNavState } = useContext(NavStateContext);

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
      return Math.ceil((workoutBlock.transition_time ?? 5) - elapsedTime);
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

  const advancePhase = useCallback(() => {
    if (phase === "transition") {
      replaceNavState({
        status: "playthrough_workout_instance",
        data: {
          workout,
          workout_block_exercise_instance_id,
          phase: "play",
          timerEntries: [{ type: "resume", time: new Date() }],
        },
      });
    } else if (entryIdx + 1 >= sortedEntries.length) {
      // We've finished the workout.
      replaceNavState({ status: "view_workout_instance", data: workout });
    } else {
      // Advance to the next exercise.
      replaceNavState({
        status: "playthrough_workout_instance",
        data: getPlaythroughExerciseInitialState({
          workout,
          entry: sortedEntries[entryIdx + 1],
        }),
      });
    }
    bark();
  }, [
    entryIdx,
    phase,
    replaceNavState,
    sortedEntries,
    workout,
    workout_block_exercise_instance_id,
  ]);

  const toggleTimer = useCallback(() => {
    replaceNavState({
      status: "playthrough_workout_instance",
      data: {
        ...props.data,
        timerEntries: timerEntries.concat([
          { type: isPaused ? "resume" : "pause", time: new Date() },
        ]),
      },
    });
  }, [isPaused, props.data, replaceNavState, timerEntries]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const timeRemaining = getTimeRemaining();
      if (timeRemaining !== undefined && timeRemaining <= 0) {
        advancePhase();
      } else {
        // Force-update the state to force a refresh of the component display.
        replaceNavState({
          status: "playthrough_workout_instance",
          data: props.data,
        });
      }
    }, 100);
    return () => clearInterval(intervalId);
  }, [advancePhase, getTimeRemaining, phase, props.data, replaceNavState]);

  // Don't wrap this in a useMemo so that it's recomputed on every re-render.
  const phaseText = [
    phase === "transition" ? "Get Ready" : "Go",
    blockExercise.limit_type === "reps"
      ? `${pluralize("Rep", instance.limit_value, true)}`
      : `${pluralize("Second", getTimeRemaining(), true)}`,
  ].join(" - ");

  const blockExerciseDescription = [
    blockExercise.description,
    blockExercise.exercise.description,
    ...blockExercise.variants.map((x) => x.description),
  ]
    .filter((x) => !!x)
    .join("\n");

  return (
    <div>
      <h1>{phaseText}</h1>
      <h2>
        {[
          blockExercise.exercise.name,
          ...blockExercise.variants.map((x) => x.name),
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
      <button onClick={advancePhase}> Next exercise </button>
      <br />
      <button onClick={toggleTimer}> {isPaused ? "Resume" : "Pause"} </button>
    </div>
  );
}
