import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.femotec.tankmo",
  appName: "Tankmo",
  webDir: "dist-native",
  ios: { contentInset: "never", backgroundColor: "#0e141f" },
  // Keep this origin stable: IndexedDB belongs to the app's local web origin.
  server: { hostname: "localhost", iosScheme: "capacitor" },
};

export default config;
