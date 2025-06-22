import { AppRegistry } from "react-native";
import "./index.css";
import App from "./App";

// Register the app for web
AppRegistry.registerComponent("ExerciseApp", () => App);

// Get the root element
const rootTag = document.getElementById("root") as HTMLElement;

// Render the app using react-native-web
AppRegistry.runApplication("ExerciseApp", {
  rootTag,
  initialProps: {},
});
