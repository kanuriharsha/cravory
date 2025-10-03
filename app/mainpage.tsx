import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function MainPage() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Welcome to Cravory</Text>
        <Text style={styles.subtitle}>You have been signed in successfully.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { marginTop: 8, color: "#666" },
});
