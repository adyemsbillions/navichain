// app/_layout.tsx
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

function RootLayoutContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0a0a0a",
        }}
      >
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return user ? (
    <Redirect href="/(app)/dashboard" />
  ) : (
    <Redirect href="/auth" />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(app)" />
      </Stack>
      <RootLayoutContent />
    </AuthProvider>
  );
}
