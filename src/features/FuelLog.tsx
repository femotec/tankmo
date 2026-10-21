import { useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import {
  type AppSettings,
  type FuelEntry,
  type FuelStation,
  fuelNames,
  sortNames,
} from "../models/types";
import { sortFuel, totals } from "../services/statistics";
import { euro, number } from "../utils/format";
import { Card, Empty, FuelCard } from "../components/ui";
export function FuelLog({
  fuel,
  stations,
  settings,
  onSort,
  open,
  add,
}: {
  fuel: FuelEntry[];
  stations: FuelStation[];
  settings: AppSettings;
  onSort: (v: AppSettings["preferredTankbookSort"]) => void;
  open: (f: FuelEntry) => void;
  add: () => void;
}) {
  const [type, setType] = useState("all"),
    [station, setStation] = useState("all");
  const filtered = sortFuel(
    fuel.filter(
      (f) =>
        (type === "all" || f.fuelType === type) &&
        (station === "all" || f.stationId === station),
    ),
    settings.preferredTankbookSort,
  );
  const sum = totals(filtered);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">JEDE TANKFÜLLUNG ZÄHLT</span>
          <h1>Tankbuch</h1>
          <p>
            {filtered.length} Einträge · {number(sum.liters)} L ·{" "}
            {euro(sum.cost)}
          </p>
        </div>
        <button
          className="add-button"
          aria-label="Tankvorgang hinzufügen"
          onClick={add}
        >
          <Plus />
        </button>
      </div>
      <div className="filter-row">
        <label>
          <span>
            <SlidersHorizontal size={15} /> Sortierung
          </span>
          <select
            value={settings.preferredTankbookSort}
            onChange={(e) =>
              onSort(e.target.value as AppSettings["preferredTankbookSort"])
            }
          >
            {Object.entries(sortNames).map(([v, label]) => (
              <option value={v} key={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kraftstoff
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Alle Kraftstoffarten</option>
            {Object.entries(fuelNames).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tankstelle
          <select value={station} onChange={(e) => setStation(e.target.value)}>
            <option value="all">Alle Tankstellen</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.deleted ? " (archiviert)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <Card className="list-card">
          {filtered.map((f) => (
            <FuelCard
              key={f.id}
              entry={f}
              stations={stations}
              onClick={() => open(f)}
            />
          ))}
        </Card>
      ) : (
        <Card>
          <Empty
            title={
              fuel.length
                ? "Keine passenden Tankvorgänge"
                : "Dein Tankbuch beginnt hier"
            }
            text={
              fuel.length
                ? "Wähle andere Filter, um deine Einträge zu sehen."
                : "Halte deine Tankfüllungen fest. Tankmo kümmert sich um die Zahlen."
            }
            action={
              <button className="primary" onClick={add}>
                <Plus size={18} /> Tankvorgang hinzufügen
              </button>
            }
          />
        </Card>
      )}
    </>
  );
}
