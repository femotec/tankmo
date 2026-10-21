import Dexie, { type Table } from "dexie";
import {
  defaultSettings,
  type FuelEntry,
  type OdometerEntry,
  type FuelStation,
  type AppSettings,
} from "../models/types";
export class TankmoDatabase extends Dexie {
  fuel!: Table<FuelEntry, string>;
  odometer!: Table<OdometerEntry, string>;
  stations!: Table<FuelStation, string>;
  settings!: Table<AppSettings, string>;
  constructor(name = "tankmo") {
    super(name);
    this.version(1).stores({
      fuel: "id,date,fuelType,odometer,stationId,createdAt",
      odometer: "id,date,odometer,createdAt",
      stations: "id,name,createdAt",
      settings: "id",
    });
  }
}
export const db = new TankmoDatabase();
export async function initialize() {
  await db.open();
  if (!(await db.settings.get("main"))) await db.settings.put(defaultSettings);
}
export async function deleteFuel(id: string) {
  await db.transaction("rw", db.fuel, async () => {
    const entry = await db.fuel.get(id);
    if (!entry) return;
    const next = await db.fuel
      .where("date")
      .aboveOrEqual(entry.date)
      .filter((f) => f.id !== id)
      .first();
    if (next)
      await db.fuel.update(next.id, {
        dataGap: true,
        updatedAt: new Date().toISOString(),
      });
    await db.fuel.delete(id);
  });
}
export async function clearData() {
  await db.transaction(
    "rw",
    [db.fuel, db.odometer, db.stations, db.settings],
    async () => {
      await Promise.all([
        db.fuel.clear(),
        db.odometer.clear(),
        db.stations.clear(),
        db.settings.clear(),
      ]);
      await db.settings.put(defaultSettings);
    },
  );
}
