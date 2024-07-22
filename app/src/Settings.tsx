import { useResetCredentials } from "./useResetCredentials";

export function Settings() {
  const { modal: resetCredentialsModal, showModal: showResetCredentialsModal } =
    useResetCredentials();
  return (
    <>
      <nav>
        <ul>
          <li key="reset_credentials">
            <button onClick={() => showResetCredentialsModal()}>
              Reset credentials
            </button>
          </li>
        </ul>
      </nav>
      {resetCredentialsModal}
    </>
  );
}
