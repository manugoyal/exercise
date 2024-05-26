import { createContext } from "react";
import { WorkoutDefDenormalized } from "./typespecs/denormalized_types";

export type NavStatePostLogin = { status: "post_login" };
export type NavStatePickWorkoutCycle = { status: "pick_workout_cycle" };
export type NavStateViewWorkoutDef = {
  status: "view_workout_def";
  data: WorkoutDefDenormalized;
};

export type NavState =
  | NavStatePostLogin
  | NavStatePickWorkoutCycle
  | NavStateViewWorkoutDef;

export type NavStateContextT = {
  navStateStack: NavState[];
  pushNavState: (x: NavState) => void;
  popNavState: () => void;
};

export const NavStateContext = createContext<NavStateContextT>({
  navStateStack: [],
  pushNavState: () => {},
  popNavState: () => {},
});
