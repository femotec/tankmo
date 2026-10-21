import { type FuelEntry, type OdometerEntry } from "../models/types";
import { dec } from "../utils/format";
export interface Observation {
  id: string;
  date: string;
  odometer: number;
  source: "fuel" | "manual";
  note?: string;
  invalid: boolean;
  distance: number | null;
}
export function timeline(
  fuel: FuelEntry[],
  manual: OdometerEntry[],
): Observation[] {
  const observations = [
    ...fuel
      .filter((f) => f.odometer !== undefined)
      .map((f) => ({
        id: f.id,
        date: f.date,
        odometer: f.odometer!,
        source: "fuel" as const,
        note: f.note,
      })),
    ...manual.map((o) => ({ ...o, source: "manual" as const })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const seen = new Set<string>();
  const unique = observations.filter((o) => {
    const key = `${o.date}/${o.odometer}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.map((o, i) => {
    const p = unique[i - 1];
    const delta = p ? o.odometer - p.odometer : null;
    return {
      ...o,
      invalid:
        delta !== null && (delta < 0 || (p.date === o.date && delta !== 0)),
      distance: delta !== null && delta >= 0 ? delta : null,
    };
  });
}
export function consumption(fuel: FuelEntry[], manual: OdometerEntry[] = []) {
  const entries = [...fuel].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const observations = timeline(fuel, manual);
  const timestampCounts = new Map<string, number>();
  for (const entry of entries)
    timestampCounts.set(entry.date, (timestampCounts.get(entry.date) ?? 0) + 1);
  const intervals: {
    start: string;
    end: string;
    distance: number;
    liters: string;
    cost: string;
    consumption: string;
    costPer100: string;
  }[] = [];
  const rejected: { start: string; end: string; reason: string }[] = [];
  let anchor: FuelEntry | undefined;
  let purchases: FuelEntry[] = [];
  for (const e of entries) {
    if (anchor) purchases.push(e);
    if (e.isFullTank) {
      if (anchor) {
        const distance =
          e.odometer !== undefined && anchor.odometer !== undefined
            ? e.odometer - anchor.odometer
            : 0;
        const window = observations.filter(
          (o) => o.date >= anchor!.date && o.date <= e.date,
        );
        const duplicate = entries.some(
          (f) =>
            f.date >= anchor!.date &&
            f.date <= e.date &&
            timestampCounts.get(f.date)! > 1,
        );
        const invalid =
          window.some((o) => o.invalid) ||
          distance <= 0 ||
          duplicate ||
          purchases.some((f) => f.dataGap);
        if (!invalid) {
          const liters = purchases.reduce((s, f) => s.plus(f.liters), dec(0));
          const cost = purchases.reduce((s, f) => s.plus(f.totalCost), dec(0));
          intervals.push({
            start: anchor.date,
            end: e.date,
            distance,
            liters: liters.toString(),
            cost: cost.toString(),
            consumption: liters.div(distance).mul(100).toString(),
            costPer100: cost.div(distance).mul(100).toString(),
          });
        } else
          rejected.push({
            start: anchor.date,
            end: e.date,
            reason: duplicate
              ? "Mehrdeutige Zeitpunkte"
              : purchases.some((f) => f.dataGap)
                ? "Tankvorgang fehlt"
                : distance <= 0
                  ? "Kilometerstand fehlt oder Strecke ungültig"
                  : "Widersprüchliche Kilometerstände",
          });
      }
      anchor = e.odometer !== undefined ? e : undefined;
      purchases = [];
    }
  }
  const distance = intervals.reduce((s, i) => s + i.distance, 0);
  const liters = intervals.reduce((s, i) => s.plus(i.liters), dec(0));
  const cost = intervals.reduce((s, i) => s.plus(i.cost), dec(0));
  return {
    intervals,
    rejected,
    distance,
    average: distance ? liters.div(distance).mul(100) : null,
    costPer100: distance ? cost.div(distance).mul(100) : null,
  };
}
