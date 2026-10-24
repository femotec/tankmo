import { db } from "./database";
import { defaultSettings, type Backup } from "../models/types";

export function readSnapshot(): Promise<Backup> {
  return db.transaction(
    "r",
    [db.fuel, db.odometer, db.stations, db.settings],
    async () => ({
      schemaVersion: 1,
      appVersion: "1.0.0",
      createdAt: new Date().toISOString(),
      fuel: await db.fuel.toArray(),
      odometer: await db.odometer.toArray(),
      stations: await db.stations.toArray(),
      settings: (await db.settings.get("main")) ?? defaultSettings,
    }),
  );
}

export function replaceSnapshot(data: Backup): Promise<void> {
  return db.transaction(
    "rw",
    [db.fuel, db.odometer, db.stations, db.settings],
    async () => {
      await Promise.all([
        db.fuel.clear(),
        db.odometer.clear(),
        db.stations.clear(),
        db.settings.clear(),
      ]);
      await db.stations.bulkAdd(data.stations);
      await db.fuel.bulkAdd(data.fuel);
      await db.odometer.bulkAdd(data.odometer);
      await db.settings.put(data.settings);
    },
  );
}
