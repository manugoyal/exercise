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
  const { workout, workout_set_exercise_instance_id, phase, timerEntries } =
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
    workout_set_exercise_instance_id,
  );
  if (entryIdx === undefined) {
    throw new Error(
      `Unknown instance id ${workout_set_exercise_instance_id} in workout instance ${workout.id}`,
    );
  }
  const { instance, workout_set_idx, set_exercise_idx } =
    sortedEntries[entryIdx];
  const workoutSet = workout.workout_def.sets[workout_set_idx];
  const setExercise = workoutSet.exercises[set_exercise_idx];

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
      return Math.ceil((workoutSet.transition_time ?? 5) - elapsedTime);
    } else if (setExercise.limit_type === "reps") {
      return undefined;
    } else {
      return Math.ceil(instance.limit_value - elapsedTime);
    }
  }, [
    instance.limit_value,
    phase,
    setExercise.limit_type,
    timerEntries,
    workoutSet.transition_time,
  ]);

  const advancePhase = useCallback(() => {
    if (phase === "transition") {
      replaceNavState({
        status: "playthrough_workout_instance",
        data: {
          workout,
          workout_set_exercise_instance_id,
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
    workout_set_exercise_instance_id,
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
    setExercise.limit_type === "reps"
      ? `${pluralize("Rep", instance.limit_value, true)}`
      : `${pluralize("Second", getTimeRemaining(), true)}`,
  ].join(" - ");

  return (
    <div>
      <h1> {phaseText} </h1>
      <h2>
        {" "}
        {[setExercise.exercise.name, setExercise.variant?.name]
          .filter((x) => !!x)
          .join(" - ")}{" "}
      </h2>
      {setExercise.description ? (
        <small>{setExercise.description}</small>
      ) : null}
      {instance.description ? (
        <small>{`Instance notes: ${instance.description}`}</small>
      ) : null}
      <h2>
        {" "}
        {[
          workout.workout_def.name,
          workoutSet.name ?? `set ${workout_set_idx + 1}`,
          `rep ${instance.set_rep}`,
        ].join(" - ")}{" "}
      </h2>
      <small>
        {[
          workoutSet.description &&
            `Set description: ${workoutSet.description}`,
          workout.workout_def.description &&
            `Workout description: ${workout.workout_def.description}`,
        ]
          .filter((x) => !!x)
          .join("\n")}
      </small>
      <br />
      <br />
      <button onClick={advancePhase}> Next exercise </button>
      <br />
      <button onClick={toggleTimer}> {isPaused ? "Resume" : "Pause"} </button>
    </div>
  );
}
