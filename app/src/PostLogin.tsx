import { useContext } from "react";
import { NavStateContext } from "./navState";

export function PostLogin() {
  const { pushNavState } = useContext(NavStateContext);
  return (
    <nav>
      Find a workout:
      <ul>
        <li key="workout_cycle">
          <button
            onClick={() => pushNavState({ status: "pick_workout_cycle" })}
          >
            Open a workout cycle
          </button>
        </li>
      </ul>
    </nav>
  );
}
