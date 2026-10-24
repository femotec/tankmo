import { initialize, clearData, deleteFuel } from "./database";
import { readSnapshot, replaceSnapshot } from "./snapshot";
import { createDurableWriter } from "./durableWriter";
import { backupSchema } from "../utils/validation";
import { isIOSApp, NativeLocalData } from "../platform/native";

const nativeWrite = createDurableWriter({
  read: readSnapshot,
  replace: replaceSnapshot,
  persist: async (data) => {
    await NativeLocalData.save({ json: JSON.stringify(data) });
  },
});

export async function initializeLocal() {
  await initialize();
  if (!isIOSApp) return;
  const saved = await NativeLocalData.load();
  if (saved.json !== null) {
    const result = backupSchema.safeParse(JSON.parse(saved.json));
    if (!result.success)
      throw new Error(
        "Die lokale App-Datei ist beschädigt oder stammt aus einer neueren Version.",
      );
    // The durable app file is authoritative; IndexedDB supplies reactive queries.
    await replaceSnapshot(result.data);
  } else {
    // First native start; also preserves any existing cache from an older app build.
    await NativeLocalData.save({ json: JSON.stringify(await readSnapshot()) });
  }
}

export function writeLocal<T>(work: () => Promise<T>): Promise<T> {
  return isIOSApp ? nativeWrite(work) : work();
}
export function deleteFuelLocal(id: string) {
  return writeLocal(() => deleteFuel(id));
}
export function clearLocalData() {
  return writeLocal(clearData);
}
