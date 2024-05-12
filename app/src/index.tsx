import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { ErrorContext, ErrorContextT, ErrorDisplay } from "./errorContext";

function TopLevelComponent() {
  const [error, setError] = React.useState<unknown | undefined>(undefined);
  const errorContextValue: ErrorContextT = { error, setError };

  const appElem = (() => {
    try {
      return (
        <ErrorContext.Provider value={errorContextValue}>
          <App />
        </ErrorContext.Provider>
      );
    } catch (err) {
      setError(err);
      return undefined;
    }
  })();

  return (
    <React.StrictMode>
      {error ? <ErrorDisplay error={error} /> : appElem}
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<TopLevelComponent />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
