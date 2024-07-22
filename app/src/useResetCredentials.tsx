import { useCallback, useContext, useRef, useState } from "react";
import { ConnectionContext } from "./connection";

export function useResetCredentials() {
  const connection = useContext(ConnectionContext);

  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newUsername, setNewUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const ref = useRef<HTMLDialogElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (
          !(currentUsername && currentPassword && newUsername && newPassword)
        ) {
          throw new Error("All fields must be filled");
        }

        await connection.runRpc("reset_user_name_and_password", {
          _auth_id: connection.auth_id,
          _current_name: currentUsername,
          _current_password: currentPassword,
          _new_name: newUsername,
          _new_password: newPassword,
        });

        alert("Successfully updated login credentials");
      } finally {
        ref.current?.close();
      }
    },
    [connection, currentPassword, currentUsername, newPassword, newUsername],
  );

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    ref.current?.close();
  }, []);

  function eventSetter(setter: (x: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value);
  }

  const modal = (
    <dialog ref={ref}>
      <form onSubmit={handleSubmit}>
        <label>
          Current username:
          <input
            type="text"
            id="current_username"
            value={currentUsername}
            onChange={eventSetter(setCurrentUsername)}
          />
        </label>
        <br />
        <label>
          Current password:
          <input
            type="password"
            id="current_password"
            value={currentPassword}
            onChange={eventSetter(setCurrentPassword)}
          />
        </label>
        <br />
        <label>
          New username:
          <input
            type="text"
            id="new_username"
            value={newUsername}
            onChange={eventSetter(setNewUsername)}
          />
        </label>
        <br />
        <label>
          New password:
          <input
            type="password"
            id="new_password"
            value={newPassword}
            onChange={eventSetter(setNewPassword)}
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
    setCurrentUsername("");
    setCurrentPassword("");
    setNewUsername("");
    setNewPassword("");
    ref.current?.showModal();
  }, []);

  return { modal, showModal };
}
