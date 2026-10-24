import Papa from "papaparse";
import { db } from "../db/database";
import { type Backup, defaultSettings } from "../models/types";
import { readSnapshot } from "../db/snapshot";
import { writeLocal } from "../db/persistence";
import { isIOSApp, NativeLocalData } from "../platform/native";
import { backupSchema } from "../utils/validation";
export async function snapshot(): Promise<Backup> {
  return readSnapshot();
}
export function parseBackup(text: string): Backup {
  try {
    return backupSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(
      "Ungültiges Backup. Version, Datensätze und Tankstellenreferenzen müssen vollständig sein.",
    );
  }
}
// One stable, typed CSV envelope. JSON preserves exact optional types and Unicode.
export function toCSV(b: Backup) {
  return (
    "\uFEFF" +
    Papa.unparse(
      [
        {
          format: "tankmo-csv-1",
          entity: "settings",
          id: "main",
          data: JSON.stringify(b.settings),
        },
        ...(["stations", "fuel", "odometer"] as const).flatMap((entity) =>
          b[entity].map((r) => ({
            format: "tankmo-csv-1",
            entity,
            id: r.id,
            data: JSON.stringify(r),
          })),
        ),
      ],
      { delimiter: ";", newline: "\r\n" },
    )
  );
}
export function fromCSV(text: string): Backup {
  const result = Papa.parse<Record<string, string>>(
    text.replace(/^\uFEFF/, ""),
    { header: true, delimiter: ";", skipEmptyLines: true },
  );
  if (
    result.errors.length ||
    result.meta.fields?.join(",") !== "format,entity,id,data"
  )
    throw new Error("Ungültiges Tankmo-CSV-Format.");
  const backup: Backup = {
    schemaVersion: 1,
    appVersion: "1.0.0",
    createdAt: new Date().toISOString(),
    fuel: [],
    odometer: [],
    stations: [],
    settings: defaultSettings,
  };
  let settingsFound = false;
  for (const row of result.data) {
    if (row.format !== "tankmo-csv-1")
      throw new Error("Unbekannte CSV-Version.");
    let record;
    try {
      record = JSON.parse(row.data);
    } catch {
      throw new Error("Ein CSV-Datensatz ist beschädigt.");
    }
    if (record?.id !== row.id)
      throw new Error("CSV-ID stimmt nicht mit dem Datensatz überein.");
    if (row.entity === "settings") {
      if (settingsFound) throw new Error("Doppelte Einstellungen.");
      settingsFound = true;
      backup.settings = record;
    } else if (
      row.entity === "fuel" ||
      row.entity === "odometer" ||
      row.entity === "stations"
    )
      backup[row.entity].push(record);
    else throw new Error("Unbekannter CSV-Datensatz.");
  }
  try {
    return backupSchema.parse(backup);
  } catch {
    throw new Error(
      "Ungültige CSV-Datensätze. Bitte Pflichtfelder, Zahlen, UUIDs und Tankstellenreferenzen prüfen.",
    );
  }
}
export type ImportPolicy = "skip" | "overwrite" | "replace";
export async function previewImport(b: Backup) {
  const current = await snapshot();
  let duplicates = 0;
  let conflicts = 0;
  for (const key of ["fuel", "odometer", "stations"] as const) {
    const map = new Map(current[key].map((r) => [r.id, JSON.stringify(r)]));
    for (const row of b[key])
      if (map.has(row.id)) {
        duplicates++;
        if (map.get(row.id) !== JSON.stringify(row)) conflicts++;
      }
  }
  return {
    duplicates,
    conflicts,
    total: b.fuel.length + b.odometer.length + b.stations.length,
  };
}
export async function restore(b: Backup, policy: ImportPolicy) {
  const valid = backupSchema.parse(b);
  return writeLocal(() =>
    db.transaction(
      "rw",
      [db.fuel, db.odometer, db.stations, db.settings],
      async () => {
        let imported = 0,
          skipped = 0;
        if (policy === "replace")
          await Promise.all([
            db.fuel.clear(),
            db.odometer.clear(),
            db.stations.clear(),
            db.settings.clear(),
          ]);
        for (const key of ["stations", "fuel", "odometer"] as const) {
          for (const row of valid[key]) {
            if (policy === "skip" && (await db.table(key).get(row.id))) {
              skipped++;
              continue;
            }
            await db.table(key).put(row);
            imported++;
          }
        }
        if (policy === "replace") await db.settings.put(valid.settings);
        for (const key of ["stations", "fuel", "odometer"] as const) {
          const ids = new Set(
            (await db.table(key).toArray()).map((r: { id: string }) => r.id),
          );
          if (!valid[key].every((r) => ids.has(r.id)))
            throw new Error(
              "Die Wiederherstellung konnte nicht verifiziert werden.",
            );
          if (policy === "replace" && ids.size !== valid[key].length)
            throw new Error("Die Datensatzanzahl stimmt nicht überein.");
        }
        return { imported, skipped };
      },
    ),
  );
}
export async function shareFile(content: string, name: string, type: string) {
  if (isIOSApp)
    return (await NativeLocalData.share({ content, name })).completed;
  const file = new File([content], name, { type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Tankmo Datensicherung" });
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError")
        return false; /* A download remains available if this browser cannot share the file. */
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
}
