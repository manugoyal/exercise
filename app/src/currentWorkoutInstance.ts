import { createContext } from "react";
import { WorkoutInstanceDenormalized } from "./typespecs/denormalized_types";

export type CurrentWorkoutInstanceContextT = {
  currentWorkoutInstance: WorkoutInstanceDenormalized | undefined;
  setCurrentWorkoutInstance: (
    x: WorkoutInstanceDenormalized | undefined,
  ) => void;
};

export const CurrentWorkoutInstanceContext =
  createContext<CurrentWorkoutInstanceContextT>({
    currentWorkoutInstance: undefined,
    setCurrentWorkoutInstance: () => {},
  });
