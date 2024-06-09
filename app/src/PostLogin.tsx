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
        <li key="past_workout_instance">
          <button
            onClick={() =>
              pushNavState({ status: "pick_past_workout_instances" })
            }
          >
            Open a past workout instance
          </button>
        </li>
      </ul>
    </nav>
  );
}
