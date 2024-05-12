import { useState } from "react";
import "./App.css";

import { EntryPoint } from "./EntryPoint";
import { ErrorContext, ErrorContextT, ErrorDisplay } from "./errorContext";

function App() {
  const [error, setError] = useState<unknown | undefined>(undefined);
  const errorContextValue: ErrorContextT = { error, setError };

  const entryPoint = (() => {
    try {
      return (
        <ErrorContext.Provider value={errorContextValue}>
          <EntryPoint />
        </ErrorContext.Provider>
      );
    } catch (err) {
      setError(err);
      return <div> Impossible </div>;
    }
  })();

  if (error) {
    return <ErrorDisplay error={error} />;
  } else {
    return entryPoint;
  }
}

export default App;
