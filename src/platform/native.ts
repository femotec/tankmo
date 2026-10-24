import { Capacitor, registerPlugin } from "@capacitor/core";

interface TankmoLocalDataPlugin {
  load(): Promise<{ json: string | null }>;
  save(options: { json: string }): Promise<void>;
  share(options: {
    content: string;
    name: string;
  }): Promise<{ completed: boolean }>;
}

export const isIOSApp = Capacitor.getPlatform() === "ios";
export const NativeLocalData =
  registerPlugin<TankmoLocalDataPlugin>("TankmoLocalData");
