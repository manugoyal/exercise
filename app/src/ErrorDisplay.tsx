import { View, Text, StyleSheet } from "react-native";

export function ErrorDisplay({ error }: { error: unknown }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong:</Text>
      <Text style={styles.errorText}>{`${error}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontFamily: "monospace",
  },
});
