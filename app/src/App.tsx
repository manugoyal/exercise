import { useState } from "react";
import { View } from "react-native";
import "./App.css"; // Import original CSS for web-specific styles

import { EntryPoint } from "./EntryPoint";
import { ErrorDisplay } from "./ErrorDisplay";
import { globalStyles } from "./styles/globalStyles";

let initializedUnhandledRejectionHandler = false;

function App() {
  const [error, setError] = useState<unknown | undefined>(undefined);

  // Web-specific error handling
  if (typeof window !== "undefined" && !initializedUnhandledRejectionHandler) {
    window.addEventListener("unhandledrejection", (event) => {
      event.preventDefault();
      setError(event.reason);
    });
    initializedUnhandledRejectionHandler = true;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  } else {
    return (
      <View style={globalStyles.container}>
        <EntryPoint />
      </View>
    );
  }
}

export default App;
