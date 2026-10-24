import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db, clearData } from "../db/database";
import {
  defaultSettings,
  meta,
  type Backup,
  type FuelEntry,
} from "../models/types";
import { createDurableWriter } from "../db/durableWriter";
import { readSnapshot } from "../db/snapshot";

const disk = vi.hoisted(() => ({
  json: null as string | null,
  fail: false,
  saves: 0,
}));
vi.mock("../platform/native", () => ({
  isIOSApp: true,
  NativeLocalData: {
    load: async () => ({ json: disk.json }),
    save: async ({ json }: { json: string }) => {
      if (disk.fail) throw new Error("Kein Speicherplatz");
      disk.json = json;
      disk.saves++;
    },
  },
}));
import {
  initializeLocal,
  writeLocal,
  deleteFuelLocal,
  clearLocalData,
} from "../db/persistence";
import { restore } from "../services/transfer";

const fuel = (): FuelEntry => ({
  ...meta(),
  date: "2026-10-24T12:00:00.000Z",
  fuelType: "superE5",
  liters: "23.456",
  totalCost: "42.17",
  note: "Örtliche Tankstelle 🚘",
  odometer: 125000,
});
const saved = () => JSON.parse(disk.json!) as Backup;

describe("Durable iOS storage and restart recovery", () => {
  beforeEach(async () => {
    await db.open();
    await clearData();
    disk.json = null;
    disk.fail = false;
    disk.saves = 0;
    await initializeLocal();
  });
  afterAll(() => db.close());

  it("persists the initial settings without creating sample entries", () => {
    expect(saved().settings).toEqual(defaultSettings);
    expect(saved().fuel).toEqual([]);
    expect(disk.saves).toBe(1);
  });
  it("restores exact entries and settings after the web cache is lost", async () => {
    const entry = fuel();
    await writeLocal(async () => {
      await db.fuel.put(entry);
      await db.settings.update("main", { appearance: "dark" });
    });
    await clearData();
    await initializeLocal();
    expect(await db.fuel.get(entry.id)).toEqual(entry);
    expect((await db.settings.get("main"))?.appearance).toBe("dark");
    expect(disk.saves).toBe(2);
  });
  it("uses the last durable file if an interrupted cache mutation is present", async () => {
    await db.fuel.put(fuel());
    await initializeLocal();
    expect(await db.fuel.count()).toBe(0);
  });
  it("rolls back a failed save and permits a later retry", async () => {
    const entry = fuel();
    const previous = disk.json;
    disk.fail = true;
    await expect(writeLocal(() => db.fuel.put(entry))).rejects.toThrow(
      "Kein Speicherplatz",
    );
    expect(await db.fuel.count()).toBe(0);
    expect(disk.json).toBe(previous);
    disk.fail = false;
    await writeLocal(() => db.fuel.put(entry));
    expect(saved().fuel).toEqual([entry]);
  });
  it("serializes simultaneous changes without losing either entry", async () => {
    const first = fuel(),
      second = fuel();
    await Promise.all([
      writeLocal(() => db.fuel.put(first)),
      writeLocal(() => db.fuel.put(second)),
    ]);
    expect(
      saved()
        .fuel.map((f) => f.id)
        .sort(),
    ).toEqual([first.id, second.id].sort());
  });
  it("persists imports, deletion and clearing instead of resurrecting removed entries", async () => {
    const entry = fuel();
    const backup = await readSnapshot();
    backup.fuel = [entry];
    await restore(backup, "replace");
    expect(saved().fuel).toEqual([entry]);
    await deleteFuelLocal(entry.id);
    expect(saved().fuel).toEqual([]);
    await writeLocal(() => db.fuel.put(entry));
    await clearLocalData();
    await initializeLocal();
    expect(await db.fuel.count()).toBe(0);
    expect(saved().settings).toEqual(defaultSettings);
  });
  it("keeps an existing backup when an import cannot be persisted", async () => {
    const entry = fuel();
    await writeLocal(() => db.fuel.put(entry));
    const replacement = await readSnapshot();
    replacement.fuel = [];
    disk.fail = true;
    await expect(restore(replacement, "replace")).rejects.toThrow();
    expect(await db.fuel.get(entry.id)).toEqual(entry);
    expect(saved().fuel).toEqual([entry]);
  });
  it.each(["{broken", '{"schemaVersion":99}'])(
    "never overwrites unreadable native data: %s",
    async (json) => {
      disk.json = json;
      await expect(initializeLocal()).rejects.toThrow();
      expect(disk.json).toBe(json);
      expect(disk.saves).toBe(1);
    },
  );
  it("does not report success before the durable write completes", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    let completed = false;
    const writer = createDurableWriter({
      read: readSnapshot,
      replace: async () => {},
      persist: async () => {
        entered();
        await pending;
      },
    });
    const result = writer(async () => "saved").then((value) => {
      completed = true;
      return value;
    });
    await started;
    expect(completed).toBe(false);
    release();
    await expect(result).resolves.toBe("saved");
  });
});
