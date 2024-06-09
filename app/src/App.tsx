import { useState } from "react";
import "./App.css";

import { EntryPoint } from "./EntryPoint";
import { ErrorDisplay } from "./ErrorDisplay";

let initializedUnhandledRejectionHandler = false;

function App() {
  const [error, setError] = useState<unknown | undefined>(undefined);

  if (!initializedUnhandledRejectionHandler) {
    window.addEventListener("unhandledrejection", (event) => {
      event.preventDefault();
      setError(event.reason);
    });
    initializedUnhandledRejectionHandler = true;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  } else {
    return <EntryPoint />;
  }
}

export default App;
