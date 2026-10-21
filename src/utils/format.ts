import Decimal from "decimal.js";
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export const dec = (value: Decimal.Value) => new Decimal(value);
export const number = (value: Decimal.Value, digits = 2) =>
  new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(dec(value).toNumber());
export const euro = (value: Decimal.Value) => `${number(value)} €`;
export const price = (entry: { totalCost: string; liters: string }) =>
  dec(entry.totalCost).div(entry.liters);
export const dateLabel = (date: string, short = false) =>
  new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: short ? "short" : "long",
    year: "numeric",
  });
export const timeLabel = (date: string) =>
  new Date(date).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
export const monthLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
export function localInput(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
export function decimalInput(text: string, places: number) {
  const trimmed = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(trimmed))
    throw new Error("Bitte eine gültige Zahl eingeben (z. B. 24,50).");
  const d = dec(trimmed);
  if (d.decimalPlaces() > places)
    throw new Error(`Bitte höchstens ${places} Nachkommastellen eingeben.`);
  return d.toFixed(places);
}
