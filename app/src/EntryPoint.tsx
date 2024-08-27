import { useCallback, useContext, useMemo, useState } from "react";

import { WorkoutInstanceDenormalized } from "./typespecs/denormalized_types";
import { ConnectionContext, useMakeConnection } from "./connection";
import { NavState, NavStateContext, NavStateContextT } from "./navState";
import {
  CurrentWorkoutInstanceContextT,
  CurrentWorkoutInstanceContext,
} from "./currentWorkoutInstance";
import { PastWorkoutInstancesPicker } from "./PastWorkoutInstancesPicker";
import { PostLogin } from "./PostLogin";
import { WorkoutCyclesPicker } from "./WorkoutCyclesPicker";
import { WorkoutDefView } from "./WorkoutDefView";
import { WorkoutInstanceView } from "./WorkoutInstanceView";
import { WorkoutInstancePlaythrough } from "./WorkoutInstancePlaythrough";
import { ExerciseHistoryView } from "./ExerciseHistoryView";
import { Settings } from "./Settings";
import { ImportExport } from "./ImportExport";

export function EntryPoint() {
  const { connection, loginForm } = useMakeConnection();
  const [navStatePushStack, setNavStatePushStack] = useState<NavState[]>([
    { status: "post_login" },
  ]);
  const [navStatePopStack, setNavStatePopStack] = useState<NavState[]>([]);

  const pushNavState = useCallback((x: NavState) => {
    setNavStatePushStack((s) => s.concat([x]));
    setNavStatePopStack([]);
  }, []);
  const popNavState = useCallback(
    () =>
      setNavStatePushStack((s) => {
        const popped = s.at(-1);
        if (popped) {
          setNavStatePopStack((popS) => popS.concat([popped]));
          return s.slice(0, -1);
        } else {
          return s;
        }
      }),
    [],
  );
  const reversePopNavState = useCallback(
    () =>
      setNavStatePopStack((s) => {
        const popped = s.at(-1);
        if (popped) {
          setNavStatePushStack((pushS) => pushS.concat([popped]));
          return s.slice(0, -1);
        } else {
          return s;
        }
      }),
    [],
  );
  const replaceNavState = useCallback(
    (x: NavState | ((current: NavState) => NavState)) => {
      setNavStatePushStack((s) => {
        const current = s.at(-1);
        if (!current) return s;
        const nextState = x instanceof Function ? x(current) : x;
        return s.slice(0, -1).concat([nextState]);
      });
    },
    [],
  );
  const navStateContext = useMemo(
    (): NavStateContextT => ({
      navStatePushStack,
      navStatePopStack,
      pushNavState,
      popNavState,
      reversePopNavState,
      replaceNavState,
    }),
    [
      navStatePushStack,
      navStatePopStack,
      popNavState,
      pushNavState,
      reversePopNavState,
      replaceNavState,
    ],
  );

  const [currentWorkoutInstance, setCurrentWorkoutInstance] = useState<
    WorkoutInstanceDenormalized | undefined
  >(undefined);
  const currentWorkoutInstanceContext = useMemo(
    (): CurrentWorkoutInstanceContextT => ({
      currentWorkoutInstance,
      setCurrentWorkoutInstance,
    }),
    [currentWorkoutInstance, setCurrentWorkoutInstance],
  );

  if (connection === undefined) {
    return <dialog open>{loginForm}</dialog>;
  } else {
    return (
      <ConnectionContext.Provider value={connection}>
        <NavStateContext.Provider value={navStateContext}>
          <CurrentWorkoutInstanceContext.Provider
            value={currentWorkoutInstanceContext}
          >
            <EntryPointNav />
            <BackToStartFooter />
          </CurrentWorkoutInstanceContext.Provider>
        </NavStateContext.Provider>
      </ConnectionContext.Provider>
    );
  }
}

function EntryPointNav() {
  const { navStatePushStack } = useContext(NavStateContext);
  const navState = navStatePushStack.at(-1);
  if (!navState) {
    throw new Error("Impossible: reached empty NavState");
  }
  if (navState.status === "post_login") {
    return <PostLogin />;
  } else if (navState.status === "pick_workout_cycle") {
    return <WorkoutCyclesPicker />;
  } else if (navState.status === "pick_past_workout_instances") {
    return <PastWorkoutInstancesPicker />;
  } else if (navState.status === "view_workout_def") {
    return <WorkoutDefView {...navState.data} />;
  } else if (navState.status === "view_workout_instance") {
    return <WorkoutInstanceView {...navState.data} />;
  } else if (navState.status === "playthrough_workout_instance") {
    return <WorkoutInstancePlaythrough {...navState.data} />;
  } else if (navState.status === "view_exercise_history") {
    return <ExerciseHistoryView {...navState.data} />;
  } else if (navState.status === "settings") {
    return <Settings />;
  } else if (navState.status === "import_export") {
    return <ImportExport />;
  } else {
    throw new Error(`Unknown NavState: ${JSON.stringify(navState)}`);
  }
}

function BackToStartFooter() {
  const {
    navStatePushStack,
    navStatePopStack,
    popNavState,
    reversePopNavState,
  } = useContext(NavStateContext);
  return (
    <footer>
      {navStatePushStack.length > 1 ? (
        <>
          <button onClick={popNavState}> Go back </button>
          <br />
        </>
      ) : null}
      {navStatePopStack.length ? (
        <>
          <button onClick={reversePopNavState}> Go forward </button>
          <br />
        </>
      ) : null}
    </footer>
  );
}
