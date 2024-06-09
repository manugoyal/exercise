import { createContext } from "react";
import {
  WorkoutInstanceDenormalized,
  WorkoutDefDenormalized,
} from "./typespecs/denormalized_types";

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

export type NavState =
  | NavStatePostLogin
  | NavStatePickWorkoutCycle
  | NavStatePickPastWorkoutInstances
  | NavStateViewWorkoutDef
  | NavStateViewWorkoutInstance;

export type NavStateContextT = {
  navStateStack: NavState[];
  pushNavState: (x: NavState) => void;
  popNavState: () => void;
  replaceNavState: (x: NavState) => void;
};

export const NavStateContext = createContext<NavStateContextT>({
  navStateStack: [],
  pushNavState: () => {},
  popNavState: () => {},
  replaceNavState: () => {},
});
