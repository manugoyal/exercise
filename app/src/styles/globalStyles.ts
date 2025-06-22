import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  // Button styles matching original CSS
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    minWidth: 100, // Equivalent to button min-width: 100px
    minHeight: 50, // Equivalent to button min-height: 50px
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },

  // Container styles
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10, // Equivalent to body padding: 10px
  },

  // Text styles
  text: {
    // whiteSpace: 'pre-wrap' is handled by CSS import
  },
  smallText: {
    fontSize: 12,
    // whiteSpace: 'pre-wrap' is handled by CSS import
  },
});
