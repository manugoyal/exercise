import { createContext } from "react";
import {
  WorkoutInstanceDenormalized,
  WorkoutDefDenormalized,
} from "./typespecs/denormalized_types";
import { PlaythroughState } from "./playthroughTypes";

export type NavStatePostLogin = { status: "post_login" };
export type NavStatePickWorkoutCycle = { status: "pick_workout_cycle" };
export type NavStatePickPastWorkoutInstances = {
  status: "pick_past_workout_instances";
};
export type NavStateViewWorkoutDef = {
  status: "view_workout_def";
  data: WorkoutDefDenormalized;
};
export type NavStateViewWorkoutInstance = {
  status: "view_workout_instance";
  data: WorkoutInstanceDenormalized;
};
export type NavStatePlaythroughWorkoutInstance = {
  status: "playthrough_workout_instance";
  data: PlaythroughState;
};
export type NavStateViewExerciseHistory = {
  status: "view_exercise_history";
  data: {
    instance: WorkoutInstanceDenormalized["block_exercises"][number];
    def: WorkoutDefDenormalized["blocks"][number]["exercises"][number];
  };
};

export type NavState =
  | NavStatePostLogin
  | NavStatePickWorkoutCycle
  | NavStatePickPastWorkoutInstances
  | NavStateViewWorkoutDef
  | NavStateViewWorkoutInstance
  | NavStatePlaythroughWorkoutInstance
  | NavStateViewExerciseHistory;

export type NavStateContextT = {
  navStateStack: NavState[];
  pushNavState: (x: NavState) => void;
  popNavState: () => void;
  replaceNavState: (x: NavState | ((current: NavState) => NavState)) => void;
};

export const NavStateContext = createContext<NavStateContextT>({
  navStateStack: [],
  pushNavState: () => {},
  popNavState: () => {},
  replaceNavState: () => {},
});
