import { useEffect, useState } from "react";
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

  // Keep the screen awake while the app is open.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let wakeLock: any = null;
    (async () => {
      try {
        if ("wakeLock" in navigator) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLock = await (navigator.wakeLock as any).request("screen");
        }
      } catch (e) {
        console.warn("Failed to acquire wakeLock:\n", e);
      }
    })();
    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, []);

  if (error) {
    return <ErrorDisplay error={error} />;
  } else {
    return <EntryPoint />;
  }
}

export default App;
