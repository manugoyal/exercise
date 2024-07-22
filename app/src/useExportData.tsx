import { useCallback, useContext, useRef, useState } from "react";
import { ConnectionContext } from "./connection";
import { ioDataSchema } from "./typespecs/io_types";
import { downloadBlob } from "./downloadBlob";

export function useExportData() {
  const connection = useContext(ConnectionContext);

  const [includeExercises, setIncludeExercises] = useState<boolean>(false);
  const [includeWorkoutDefs, setIncludeWorkoutDefs] = useState<boolean>(false);
  const [includeWorkoutCycles, setIncludeWorkoutCycles] =
    useState<boolean>(false);
  const [includeWorkoutInstances, setIncludeWorkoutInstances] =
    useState<boolean>(false);
  const [formatMinified, setFormatMinified] = useState<boolean>(false);
  const ref = useRef<HTMLDialogElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const ioData = ioDataSchema.parse(
          await connection.runRpc("get_io_data", {
            _auth_id: connection.auth_id,
            _include_exercises: includeExercises,
            _include_workout_defs: includeWorkoutDefs,
            _include_workout_cycles: includeWorkoutCycles,
            _include_workout_instances: includeWorkoutInstances,
          }),
        );
        const jsonData = formatMinified
          ? JSON.stringify(ioData)
          : JSON.stringify(ioData, null, 2);
        downloadBlob({
          blob: new Blob([jsonData], { type: "application/json" }),
          filename: "workout_data_export.json",
        });
      } finally {
        ref.current?.close();
      }
    },
    [
      connection,
      formatMinified,
      includeExercises,
      includeWorkoutCycles,
      includeWorkoutDefs,
      includeWorkoutInstances,
    ],
  );

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    ref.current?.close();
  }, []);

  function eventSetter(setter: (x: boolean) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.checked);
  }

  const modal = (
    <dialog ref={ref}>
      <form onSubmit={handleSubmit}>
        <label>
          Include exercises:
          <input
            type="checkbox"
            id="include_exercises"
            checked={includeExercises}
            onChange={eventSetter(setIncludeExercises)}
          />
        </label>
        <br />
        <label>
          Include workout definitions:
          <input
            type="checkbox"
            id="include_workout_defs"
            checked={includeWorkoutDefs}
            onChange={eventSetter(setIncludeWorkoutDefs)}
          />
        </label>
        <br />
        <label>
          Include workout cycles:
          <input
            type="checkbox"
            id="include_workout_cycles"
            checked={includeWorkoutCycles}
            onChange={eventSetter(setIncludeWorkoutCycles)}
          />
        </label>
        <br />
        <label>
          Include workout instances:
          <input
            type="checkbox"
            id="include_workout_instances"
            checked={includeWorkoutInstances}
            onChange={eventSetter(setIncludeWorkoutInstances)}
          />
        </label>
        <br />
        <label>
          Export in minified format:
          <input
            type="checkbox"
            id="format_minified"
            checked={formatMinified}
            onChange={eventSetter(setFormatMinified)}
          />
        </label>
        <br />
        <button type="submit"> Submit </button>
        <br />
        <button onClick={handleCancel}> Cancel </button>
      </form>
    </dialog>
  );

  const showModal = useCallback(() => {
    setIncludeExercises(false);
    setIncludeWorkoutDefs(false);
    setIncludeWorkoutCycles(false);
    setIncludeWorkoutInstances(false);
    setFormatMinified(false);
    ref.current?.showModal();
  }, []);

  return { modal, showModal };
}
