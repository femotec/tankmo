import { describe, it, expect, beforeEach, afterAll } from "vitest";
import Dexie from "dexie";
import {
  db,
  TankmoDatabase,
  clearData,
  deleteFuel,
  initialize,
} from "../db/database";
import {
  type FuelEntry,
  type Backup,
  defaultSettings,
  meta,
} from "../models/types";
import { decimalInput, price } from "../utils/format";
import { fuelSchema } from "../utils/validation";
import {
  totals,
  comparison,
  inMonth,
  monthly,
  sortFuel,
} from "../services/statistics";
import { consumption, timeline } from "../services/consumption";
import {
  fromCSV,
  toCSV,
  parseBackup,
  restore,
  snapshot,
  previewImport,
} from "../services/transfer";
const f = (patch: Partial<FuelEntry> = {}): FuelEntry => ({
  ...meta(),
  date: "2026-01-01T12:00:00.000Z",
  fuelType: "superE5",
  liters: "20.000",
  totalCost: "40.00",
  ...patch,
});
const backup = (fuel: FuelEntry[] = []): Backup => ({
  schemaVersion: 1,
  appVersion: "1.0.0",
  createdAt: new Date().toISOString(),
  fuel,
  odometer: [],
  stations: [],
  settings: defaultSettings,
});
const full = (
  km: number,
  date: string,
  liters = "20.000",
  totalCost = "40.00",
) => f({ odometer: km, date, isFullTank: true, liters, totalCost });
describe("Exact decimal arithmetic", () => {
  it.each([
    ["20.000", "40.00", "2.000"],
    ["25.000", "54.25", "2.170"],
  ])("%s liters for %s EUR", (liters, totalCost, expected) =>
    expect(price(f({ liters, totalCost })).toFixed(3)).toBe(expected),
  );
  it("weights price by liters", () =>
    expect(
      totals([
        f({ liters: "10.000", totalCost: "20.00" }),
        f({ liters: "30.000", totalCost: "45.00" }),
      ]).average?.toFixed(3),
    ).toBe("1.625"));
  it("adds cents without binary floating point", () =>
    expect(
      totals([f({ totalCost: "0.10" }), f({ totalCost: "0.20" })]).cost.toFixed(
        2,
      ),
    ).toBe("0.30"));
  it("normalizes German decimals", () =>
    expect(decimalInput("24,50", 3)).toBe("24.500"));
  it.each(["-1", "Infinity", "NaN", "1.2.3", "1,2,3", "1e2", ""])(
    "rejects invalid input %s",
    (input) => expect(() => decimalInput(input, 2)).toThrow(),
  );
  it("rejects excess precision", () =>
    expect(() => decimalInput("1,001", 2)).toThrow());
  it.each([
    { liters: "0.000" },
    { totalCost: "-1.00" },
    { odometer: -1 },
    { date: "no date" },
  ])("validates records", (patch) =>
    expect(fuelSchema.safeParse(f(patch)).success).toBe(false),
  );
});
describe("Calendar statistics", () => {
  const entries = [
    f({
      date: new Date(2025, 11, 31, 23, 59).toISOString(),
      totalCost: "10.00",
    }),
    f({ date: new Date(2026, 0, 1, 0, 1).toISOString(), totalCost: "20.00" }),
    f({ date: new Date(2026, 0, 15).toISOString(), totalCost: "30.00" }),
    f({ date: new Date(2026, 1, 1).toISOString(), totalCost: "5.00" }),
  ];
  it("uses local calendar boundaries", () => {
    expect(inMonth(entries, 2026, 0)).toHaveLength(2);
    expect(totals(inMonth(entries, 2026, 0)).cost.toFixed(2)).toBe("50.00");
  });
  it("compares across year boundaries", () => {
    const c = comparison(entries, 2026, 0);
    expect(c.prior.cost.toFixed(2)).toBe("10.00");
    expect(c.percent?.toFixed(0)).toBe("400");
  });
  it("has zero-spending months", () =>
    expect(monthly(entries, 2026)[5].cost).toBe(0));
  it("does not invent a percent for zero prior spending", () =>
    expect(comparison(entries, 2026, 8).percent).toBeNull());
  it("reflects corrections and deletions", () => {
    const edited = entries.map((e) => ({ ...e, totalCost: "1.00" }));
    expect(totals(inMonth(edited, 2026, 0)).cost.toString()).toBe("2");
    expect(totals(inMonth(edited.slice(0, 1), 2026, 0)).cost.toString()).toBe(
      "0",
    );
  });
});
describe("Tankbook sorting", () => {
  const a = f({
      id: "a",
      date: "2026-01-01T12:00:00.000Z",
      totalCost: "20.00",
    }),
    b = f({ id: "b", date: "2026-01-02T12:00:00.000Z", totalCost: "60.00" }),
    c = f({ id: "c", date: "2026-01-03T12:00:00.000Z", totalCost: "40.00" });
  it.each([
    ["newest", ["c", "b", "a"]],
    ["oldest", ["a", "b", "c"]],
    ["highest", ["b", "c", "a"]],
    ["lowest", ["a", "c", "b"]],
  ] as const)("%s", (mode, ids) =>
    expect(sortFuel([a, b, c], mode).map((e) => e.id)).toEqual(ids),
  );
  it("breaks price ties by newest date then UUID", () =>
    expect(
      sortFuel(
        [f({ ...a, totalCost: "40.00" }), c, f({ ...c, id: "d" })],
        "highest",
      ).map((e) => e.id),
    ).toEqual(["c", "d", "a"]));
});
describe("Full-tank consumption", () => {
  const start = full(50000, "2026-01-01T12:00:00.000Z", "50.000", "100.00");
  const partial = f({
    date: "2026-01-02T12:00:00.000Z",
    liters: "15.000",
    totalCost: "25.04",
    odometer: 50300,
    isFullTank: false,
  });
  const end = full(50600, "2026-01-03T12:00:00.000Z", "21.000", "40.00");
  it("includes partial fills and excludes the start", () => {
    const result = consumption([start, partial, end]);
    expect(result.average?.toString()).toBe("6");
    expect(result.costPer100?.toFixed(2)).toBe("10.84");
    expect(result.distance).toBe(600);
  });
  it("supports two full tanks", () =>
    expect(consumption([start, end]).average?.toString()).toBe("3.5"));
  it("weights intervals by distance", () => {
    const next = full(51000, "2026-01-04T12:00:00.000Z", "40.000", "80.00");
    expect(consumption([start, partial, end, next]).average?.toString()).toBe(
      "7.6",
    );
  });
  it("supports several partial fills without odometer", () => {
    const extra = f({ date: "2026-01-02T14:00:00.000Z", liters: "6.000" });
    expect(consumption([start, partial, extra, end]).average?.toString()).toBe(
      "7",
    );
  });
  it("requires start anchor", () =>
    expect(consumption([partial, end]).average).toBeNull());
  it("rejects zero distance", () =>
    expect(
      consumption([start, { ...end, odometer: 50000 }]).average,
    ).toBeNull());
  it("rejects falling odometer", () =>
    expect(
      consumption([start, { ...partial, odometer: 49999 }, end]).average,
    ).toBeNull());
  it("rejects a known missing fuel purchase", () =>
    expect(
      consumption([start, { ...partial, dataGap: true }, end]).average,
    ).toBeNull());
  it("requires end odometer and breaks an unknown full anchor", () =>
    expect(
      consumption([
        start,
        { ...partial, isFullTank: true, odometer: undefined },
        end,
      ]).average,
    ).toBeNull());
  it("rejects ambiguous equal fuel timestamps", () =>
    expect(
      consumption([start, partial, { ...end, date: partial.date }]).average,
    ).toBeNull());
  it("uses manual observations only to check plausibility", () => {
    const observation = {
      ...meta(),
      date: "2026-01-02T15:00:00.000Z",
      odometer: 60000,
    };
    expect(consumption([start, end], [observation]).average).toBeNull();
    expect(consumption([], [observation]).average).toBeNull();
  });
  it("deduplicates the same observation", () => {
    const manual = { ...meta(), date: start.date, odometer: start.odometer! };
    expect(timeline([start], [manual])).toHaveLength(1);
  });
  it("flags contradictions at same timestamp", () => {
    const manual = { ...meta(), date: start.date, odometer: 50100 };
    expect(timeline([start], [manual]).some((o) => o.invalid)).toBe(true);
  });
});
describe("Backup, CSV and IndexedDB", () => {
  beforeEach(async () => {
    await initialize();
    await clearData();
  });
  afterAll(async () => {
    db.close();
    await Dexie.delete("tankmo");
  });
  it("round-trips Unicode, quotes, separators, multiline notes, exact decimals and IDs", () => {
    const b = backup([
      f({ note: 'Grüße; "München"\nNächste Zeile', liters: "24.501" }),
    ]);
    expect(fromCSV(toCSV(b)).fuel).toEqual(b.fuel);
    expect(parseBackup(JSON.stringify(b))).toEqual(b);
  });
  it("round-trips relationships, manual odometers and settings", async () => {
    const station = {
      ...meta(),
      name: "Öl & Fahrt",
      locationDescription: "Köln",
    };
    const b = {
      ...backup([f({ stationId: station.id })]),
      stations: [station],
      odometer: [{ ...meta(), date: new Date().toISOString(), odometer: 42 }],
      settings: { ...defaultSettings, appearance: "dark" as const },
    };
    await restore(fromCSV(toCSV(b)), "replace");
    const saved = await snapshot();
    expect(saved.fuel).toEqual(b.fuel);
    expect(saved.stations).toEqual(b.stations);
    expect(saved.odometer).toEqual(b.odometer);
    expect(saved.settings).toEqual(b.settings);
  });
  it("skips duplicates and reports conflicts", async () => {
    const entry = f();
    await db.fuel.put(entry);
    const incoming = backup([{ ...entry, totalCost: "99.00" }]);
    expect(await previewImport(incoming)).toMatchObject({
      duplicates: 1,
      conflicts: 1,
    });
    expect(await restore(incoming, "skip")).toMatchObject({
      imported: 0,
      skipped: 1,
    });
    expect((await db.fuel.get(entry.id))!.totalCost).toBe("40.00");
  });
  it("overwrites only under explicit policy", async () => {
    const entry = f();
    await db.fuel.put(entry);
    await restore(backup([{ ...entry, totalCost: "99.00" }]), "overwrite");
    expect((await db.fuel.get(entry.id))!.totalCost).toBe("99.00");
  });
  it("replaces and verifies counts", async () => {
    await db.fuel.put(f());
    const b = backup([f(), f()]);
    await restore(b, "replace");
    expect(await db.fuel.count()).toBe(2);
  });
  it("rejects malformed files, future versions and broken references", () => {
    expect(() => fromCSV("id,foo\n1,2")).toThrow();
    expect(() => parseBackup("{bad")).toThrow();
    expect(() =>
      parseBackup(JSON.stringify({ ...backup(), schemaVersion: 2 })),
    ).toThrow();
    expect(() =>
      parseBackup(
        JSON.stringify(backup([f({ stationId: crypto.randomUUID() })])),
      ),
    ).toThrow();
  });
  it("rejects duplicate UUIDs inside a file", () => {
    const entry = f();
    expect(() => parseBackup(JSON.stringify(backup([entry, entry])))).toThrow();
  });
  it("normalizes imported timestamp offsets before chronological sorting", () => {
    const b = backup([f({ date: "2026-01-01T13:00:00+01:00" })]);
    expect(parseBackup(JSON.stringify(b)).fuel[0].date).toBe(
      "2026-01-01T12:00:00.000Z",
    );
  });
  it("keeps existing data when validation fails", async () => {
    const entry = f();
    await db.fuel.put(entry);
    await expect(
      restore(
        { ...backup(), schemaVersion: 2 } as unknown as Backup,
        "replace",
      ),
    ).rejects.toThrow();
    expect(await db.fuel.count()).toBe(1);
  });
  it("persists CRUD across close and reopen", async () => {
    const database = new TankmoDatabase("persistence-test");
    await database.open();
    const entry = f();
    await database.fuel.add(entry);
    await database.fuel.update(entry.id, { totalCost: "55.00" });
    database.close();
    await database.open();
    expect((await database.fuel.get(entry.id))!.totalCost).toBe("55.00");
    await database.fuel.delete(entry.id);
    expect(await database.fuel.count()).toBe(0);
    database.close();
    await Dexie.delete("persistence-test");
  });
  it("opens the initial schema without inventing records", async () => {
    expect(await db.fuel.count()).toBe(0);
    expect(db.verno).toBe(1);
    expect(await db.settings.get("main")).toEqual(defaultSettings);
  });
  it("marks the next fuel entry incomplete after deletion", async () => {
    const a = f(),
      b = f({ date: "2026-01-02T12:00:00.000Z" });
    await db.fuel.bulkAdd([a, b]);
    await deleteFuel(a.id);
    expect((await db.fuel.get(b.id))!.dataGap).toBe(true);
  });
});
