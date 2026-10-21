export const fuelNames = {
  superE5: "Super E5",
  superE10: "Super E10",
  superPlus: "Super Plus",
} as const;
export type FuelType = keyof typeof fuelNames;
export const sortNames = {
  newest: "Neueste zuerst",
  oldest: "Älteste zuerst",
  highest: "Höchster Literpreis zuerst",
  lowest: "Niedrigster Literpreis zuerst",
} as const;
export type SortMode = keyof typeof sortNames;
export interface RecordMeta {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export interface FuelEntry extends RecordMeta {
  date: string;
  fuelType: FuelType;
  liters: string;
  totalCost: string;
  odometer?: number;
  isFullTank?: boolean;
  stationId?: string;
  note?: string;
  dataGap?: boolean;
}
export interface OdometerEntry extends RecordMeta {
  date: string;
  odometer: number;
  note?: string;
}
export interface FuelStation extends RecordMeta {
  name: string;
  locationDescription?: string;
  deleted?: boolean;
}
export interface AppSettings {
  id: "main";
  appearance: "auto" | "light" | "dark";
  preferredTankbookSort: SortMode;
  defaultFuelType: FuelType;
  lastBackup?: string;
}
export const defaultSettings: AppSettings = {
  id: "main",
  appearance: "auto",
  preferredTankbookSort: "newest",
  defaultFuelType: "superE5",
};
export interface Backup {
  schemaVersion: 1;
  appVersion: string;
  createdAt: string;
  fuel: FuelEntry[];
  odometer: OdometerEntry[];
  stations: FuelStation[];
  settings: AppSettings;
}
export const meta = (): RecordMeta => {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), createdAt: now, updatedAt: now };
};
