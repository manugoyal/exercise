import { useCallback, useContext, useMemo, useState } from "react";

import { ConnectionContext, useMakeConnection } from "./connection";
import { NavState, NavStateContext, NavStateContextT } from "./navState";
import { PastWorkoutInstancesPicker } from "./PastWorkoutInstancesPicker";
import { PostLogin } from "./PostLogin";
import { WorkoutCyclesPicker } from "./WorkoutCyclesPicker";
import { WorkoutDefView } from "./WorkoutDefView";
import { WorkoutInstanceView } from "./WorkoutInstanceView";
import { WorkoutInstancePlaythrough } from "./WorkoutInstancePlaythrough";

export function EntryPoint() {
  const { connection, loginForm } = useMakeConnection();
  const [navStateStack, setNavStateStack] = useState<NavState[]>([
    { status: "post_login" },
  ]);

  const pushNavState = useCallback(
    (x: NavState) => setNavStateStack((s) => s.concat([x])),
    [],
  );
  const popNavState = useCallback(
    () =>
      setNavStateStack((s) => {
        return s.length > 1 ? s.slice(0, -1) : s;
      }),
    [],
  );
  const replaceNavState = useCallback(
    (x: NavState) => setNavStateStack((s) => s.slice(0, -1).concat([x])),
    [],
  );
  const navStateContext = useMemo(
    (): NavStateContextT => ({
      navStateStack,
      pushNavState,
      popNavState,
      replaceNavState,
    }),
    [navStateStack, popNavState, pushNavState, replaceNavState],
  );

  if (connection === undefined) {
    return <dialog open>{loginForm}</dialog>;
  } else {
    return (
      <ConnectionContext.Provider value={connection}>
        <NavStateContext.Provider value={navStateContext}>
          <EntryPointNav />
          <BackToStartFooter />
        </NavStateContext.Provider>
      </ConnectionContext.Provider>
    );
  }
}

function EntryPointNav() {
  const { navStateStack } = useContext(NavStateContext);
  const navState = navStateStack.at(-1);
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
    return <WorkoutDefView workoutDef={navState.data} />;
  } else if (navState.status === "view_workout_instance") {
    return <WorkoutInstanceView workoutInstance={navState.data} />;
  } else if (navState.status === "playthrough_workout_instance") {
    return <WorkoutInstancePlaythrough data={navState.data} />;
  } else {
    throw new Error(`Unknown NavState: ${JSON.stringify(navState)}`);
  }
}

function BackToStartFooter() {
  const { popNavState } = useContext(NavStateContext);
  return (
    <footer>
      <button onClick={popNavState}> Go back </button>
    </footer>
  );
}
