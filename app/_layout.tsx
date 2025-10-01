import { Stack, usePathname } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function RootLayout() {
  const pathname = usePathname();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

  const CustomHeader = ({
    title,
    progress,
  }: {
    title: string;
    progress: number;
  }) => {
    const pct = clamp(progress);
    const fillWidth = containerWidth ? Math.round(containerWidth * (pct / 100)) : `${pct}%`;
    return (
      <View
        style={styles.headerContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w && w !== containerWidth) setContainerWidth(w);
        }}
      >
        {pct > 0 && (
          <View
            style={[
              styles.headerBackgroundFill,
              typeof fillWidth === "number" ? { width: fillWidth } : { width: fillWidth },
            ]}
          />
        )}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                { width: typeof fillWidth === "number" ? fillWidth : `${pct}%` },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  const resolveProgress = (route: any, options: any) => {
    const fromParams = route?.params?.progress;
    const fromOptions = options?.headerProgress;

    if (typeof fromParams === "number") return fromParams;
    if (typeof fromOptions === "number") return fromOptions;

    // Default: 25% on login/index page
    if (pathname.includes("login") || pathname === "/") return 25;
    return 0;
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: ({ route, options }) => (
          <CustomHeader
            title={(options.title as string) || route.name || ""}
            progress={resolveProgress(route, options)}
          />
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Cravory",
          // headerProgress: 25,
        }}
      />
      <Stack.Screen
        name="otp"
        options={{
          title: "OTP Verification",
          headerProgress: 50,
        }}
      />
      <Stack.Screen
        name="mainpage"
        options={{
          title: "Cravory",
          headerProgress: 100,
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
  backgroundColor: '#FFFFFF',
  paddingTop: 5,
  marginTop: 40,
  width: '50%',
  left: 90,
  position: 'relative',
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 4,
  borderBottomLeftRadius: 25,
  borderBottomRightRadius: 25,
  borderTopRightRadius: 25,
  borderTopLeftRadius: 25,
},

  headerBackgroundFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#FFB800',
    zIndex: 0,
    pointerEvents: 'none',
  },
  headerContent: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000000',
  },
  progressContainer: {
    width: '100%',
    paddingVertical: 0,
  },
  progressBackground: {
    height: 4,
    width: '100%',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB800',
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

