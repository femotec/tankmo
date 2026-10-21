import { type FuelEntry, type SortMode } from "../models/types";
import { dec, price } from "../utils/format";
export function totals(entries: FuelEntry[]) {
  const cost = entries.reduce((sum, e) => sum.plus(e.totalCost), dec(0));
  const liters = entries.reduce((sum, e) => sum.plus(e.liters), dec(0));
  return {
    cost,
    liters,
    count: entries.length,
    average: liters.gt(0) ? cost.div(liters) : null,
  };
}
export function inMonth(entries: FuelEntry[], year: number, month: number) {
  return entries.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}
export function comparison(entries: FuelEntry[], year: number, month: number) {
  const previous = new Date(year, month - 1, 1);
  const current = totals(inMonth(entries, year, month));
  const prior = totals(
    inMonth(entries, previous.getFullYear(), previous.getMonth()),
  );
  const difference = current.cost.minus(prior.cost);
  return {
    current,
    prior,
    difference,
    percent: prior.cost.gt(0) ? difference.div(prior.cost).mul(100) : null,
  };
}
export function sortFuel(entries: FuelEntry[], mode: SortMode) {
  return [...entries].sort((a, b) => {
    const tie = b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
    if (mode === "oldest")
      return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
    if (mode === "highest" || mode === "lowest") {
      const diff = price(a).cmp(price(b));
      return (mode === "highest" ? -diff : diff) || tie;
    }
    return tie;
  });
}
export function monthly(entries: FuelEntry[], year: number) {
  return Array.from({ length: 12 }, (_, month) => ({
    month,
    label: new Date(year, month, 1).toLocaleDateString("de-DE", {
      month: "short",
    }),
    cost: totals(inMonth(entries, year, month)).cost.toNumber(),
  }));
}
