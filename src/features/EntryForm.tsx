import { useState } from "react";
import { Check, Fuel } from "lucide-react";
import { db } from "../db/database";
import {
  type AppSettings,
  type FuelEntry,
  type OdometerEntry,
  type FuelStation,
  fuelNames,
  meta,
} from "../models/types";
import { dec, decimalInput, localInput, number } from "../utils/format";
import { fuelSchema, odometerSchema } from "../utils/validation";
interface Props {
  kind: "fuel" | "odometer";
  entry?: FuelEntry | OdometerEntry;
  settings: AppSettings;
  stations: FuelStation[];
  onSaved: () => void;
  onCancel: () => void;
}
export function EntryForm({
  kind,
  entry,
  settings,
  stations,
  onSaved,
  onCancel,
}: Props) {
  const fuel = entry && "liters" in entry ? entry : undefined;
  const [initialDate] = useState(() =>
    localInput(entry ? new Date(entry.date) : undefined),
  );
  const [date, setDate] = useState(initialDate);
  const [fuelType, setFuelType] = useState(
    fuel?.fuelType ?? settings.defaultFuelType,
  );
  const [liters, setLiters] = useState(fuel?.liters.replace(".", ",") ?? "");
  const [cost, setCost] = useState(fuel?.totalCost.replace(".", ",") ?? "");
  const [odometer, setOdometer] = useState(entry?.odometer?.toString() ?? "");
  const [full, setFull] = useState(
    fuel?.isFullTank === true
      ? "yes"
      : fuel?.isFullTank === false
        ? "no"
        : "unknown",
  );
  const [stationId, setStationId] = useState(fuel?.stationId ?? "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [gap, setGap] = useState(fuel?.dataGap ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  let live: string | null = null;
  try {
    const l = dec(decimalInput(liters, 3));
    if (l.gt(0)) live = number(dec(decimalInput(cost, 2)).div(l), 3);
  } catch {
    /* Incomplete decimal input has no derived price. */
  }
  const dirty =
    date !== initialDate ||
    liters !== (fuel?.liters.replace(".", ",") ?? "") ||
    cost !== (fuel?.totalCost.replace(".", ",") ?? "") ||
    odometer !== (entry?.odometer?.toString() ?? "") ||
    note !== (entry?.note ?? "") ||
    fuelType !== (fuel?.fuelType ?? settings.defaultFuelType) ||
    stationId !== (fuel?.stationId ?? "") ||
    full !==
      (fuel?.isFullTank === true
        ? "yes"
        : fuel?.isFullTank === false
          ? "no"
          : "unknown") ||
    gap !== (fuel?.dataGap ?? false);
  const cancel = () => {
    if (!dirty || confirm("Ungespeicherte Änderungen verwerfen?")) onCancel();
  };
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!date || !Number.isFinite(new Date(date).getTime()))
        throw new Error("Bitte Datum und Uhrzeit prüfen.");
      if (odometer && !/^\d+$/.test(odometer))
        throw new Error(
          "Kilometerstand muss eine nichtnegative ganze Zahl sein.",
        );
      const base = {
        ...(entry ?? meta()),
        date: new Date(date).toISOString(),
        odometer: odometer ? Number(odometer) : undefined,
        note: note || undefined,
        updatedAt: new Date().toISOString(),
      };
      if (kind === "fuel") {
        const record = {
          ...base,
          fuelType,
          liters: decimalInput(liters, 3),
          totalCost: decimalInput(cost, 2),
          stationId: stationId || undefined,
          isFullTank: full === "unknown" ? undefined : full === "yes",
          dataGap: gap,
        };
        const validated = fuelSchema.safeParse(record);
        if (!validated.success)
          throw new Error(
            "Bitte Liter (> 0), Gesamtpreis (≥ 0) und Kilometerstand prüfen.",
          );
        const unusual =
          dec(record.liters).gt(150) ||
          dec(record.totalCost).div(record.liters).gt(4) ||
          dec(record.totalCost).div(record.liters).lt("0.5");
        if (
          unusual &&
          !confirm(
            "Diese Menge oder dieser Literpreis ist ungewöhnlich. Trotzdem speichern?",
          )
        )
          return;
        await db.fuel.put(validated.data);
      } else {
        const validated = odometerSchema.safeParse(base);
        if (!validated.success)
          throw new Error("Bitte einen gültigen Kilometerstand eintragen.");
        await db.odometer.put(validated.data);
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error && err.name === "Error"
          ? err.message
          : "Speichern fehlgeschlagen. Bitte Speicherplatz und Browserberechtigungen prüfen.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="entry-form">
      <label>
        Datum & Uhrzeit
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      {kind === "fuel" && (
        <>
          <label>
            Kraftstoff
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as typeof fuelType)}
            >
              {Object.entries(fuelNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Liter
              <input
                inputMode="decimal"
                placeholder="0,000"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                required
              />
            </label>
            <label>
              Gesamtpreis (€)
              <input
                inputMode="decimal"
                placeholder="0,00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="live-price">
            <Fuel size={18} />
            <span>Dein Literpreis</span>
            <strong>{live ? `${live} €/L` : "—"}</strong>
          </div>
        </>
      )}
      <label>
        Kilometerstand{kind === "fuel" ? " (optional)" : ""}
        <input
          inputMode="numeric"
          placeholder="z. B. 50600"
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
          required={kind === "odometer"}
        />
      </label>
      {kind === "fuel" && (
        <>
          <label>
            Vollgetankt?
            <select value={full} onChange={(e) => setFull(e.target.value)}>
              <option value="unknown">Nicht angegeben</option>
              <option value="yes">Ja, vollgetankt</option>
              <option value="no">Nein, Teilbetankung</option>
            </select>
          </label>
          <label>
            Tankstelle (optional)
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
            >
              <option value="">Ohne Tankstelle</option>
              {stations
                .filter((s) => !s.deleted || s.id === stationId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.deleted ? " (archiviert)" : ""}
                  </option>
                ))}
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={gap}
              onChange={(e) => setGap(e.target.checked)}
            />
            <span>Seit dem letzten Eintrag fehlt ein Tankvorgang</span>
          </label>
          <p className="muted small">
            Nur vollständige Volltank-Intervalle mit Kilometerständen liefern
            einen verlässlichen Verbrauch.
          </p>
        </>
      )}
      <label>
        Notiz (optional)
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Platz für deine Notizen …"
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="secondary" onClick={cancel}>
          Abbrechen
        </button>
        <button className="primary" disabled={busy}>
          <Check size={18} />
          {busy ? "Speichern …" : "Speichern"}
        </button>
      </div>
    </form>
  );
}
