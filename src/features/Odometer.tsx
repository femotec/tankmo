import { Plus, Pencil, TriangleAlert } from "lucide-react";
import { type FuelEntry, type OdometerEntry } from "../models/types";
import { consumption, timeline } from "../services/consumption";
import { dateLabel, number, timeLabel, euro } from "../utils/format";
import { Card, Empty, Metric } from "../components/ui";
export function Odometer({
  fuel,
  manual,
  add,
  edit,
  openFuel,
}: {
  fuel: FuelEntry[];
  manual: OdometerEntry[];
  add: () => void;
  edit: (e: OdometerEntry) => void;
  openFuel: (e: FuelEntry) => void;
}) {
  const observations = timeline(fuel, manual);
  const use = consumption(fuel, manual);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">DEIN WEG IN ZAHLEN</span>
          <h1>Kilometerstände</h1>
          <p>Jeder Kilometer erzählt eine Geschichte.</p>
        </div>
        <button
          className="add-button"
          aria-label="Kilometerstand eintragen"
          onClick={add}
        >
          <Plus />
        </button>
      </div>
      <div className="metrics-grid">
        <Metric
          label="Letzter Kilometerstand"
          value={
            observations.length
              ? `${number(observations.at(-1)!.odometer, 0)} km`
              : "—"
          }
        />
        <Metric
          label="Ø Verbrauch"
          value={use.average ? `${number(use.average, 1)} L/100 km` : "—"}
          detail={
            use.costPer100
              ? `${euro(use.costPer100)} /100 km`
              : "Volltank-Daten fehlen"
          }
        />
      </div>
      <div className="section-heading">
        <h2>Deine Kilometer</h2>
        <span className="muted small">{observations.length} Beobachtungen</span>
      </div>
      <Card className="timeline">
        {observations.length ? (
          [...observations].reverse().map((o) => (
            <button
              className="timeline-row"
              key={o.id}
              onClick={() =>
                o.source === "manual"
                  ? edit(manual.find((m) => m.id === o.id)!)
                  : openFuel(fuel.find((f) => f.id === o.id)!)
              }
            >
              <span className={`timeline-dot ${o.invalid ? "warning" : ""}`} />
              <span>
                <strong>{number(o.odometer, 0)} km</strong>
                <small>
                  {dateLabel(o.date, true)} · {timeLabel(o.date)} ·{" "}
                  {o.source === "fuel" ? "Tankvorgang" : "Manuell"}
                </small>
                {o.note && <small>{o.note}</small>}
                {o.invalid ? (
                  <small className="error">
                    Widersprüchlicher Stand – bitte prüfen
                  </small>
                ) : (
                  o.distance !== null && (
                    <small className="accent">
                      + {number(o.distance, 0)} km seit dem letzten Stand
                    </small>
                  )
                )}
              </span>
              <Pencil size={16} />
            </button>
          ))
        ) : (
          <Empty
            title="Wohin geht deine nächste Fahrt?"
            text="Erfasse deinen Kilometerstand – beim Tanken oder einfach zwischendurch."
            action={
              <button className="primary" onClick={add}>
                Kilometerstand eintragen
              </button>
            }
          />
        )}
      </Card>
      <div className="section-heading">
        <h2>Volltank-Intervalle</h2>
      </div>
      <Card>
        {use.intervals.length ? (
          use.intervals.map((i) => (
            <div className="data-row" key={i.end}>
              <div>
                <strong>{number(i.consumption, 1)} L/100 km</strong>
                <small>
                  {dateLabel(i.start, true)} – {dateLabel(i.end, true)} ·{" "}
                  {number(i.distance, 0)} km
                </small>
              </div>
              <div className="align-right">
                {euro(i.costPer100)}
                <small>/100 km</small>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">
            Für die Verbrauchsberechnung benötigst du mindestens zwei geeignete
            Volltank-Einträge mit Kilometerstand.
          </p>
        )}
        {use.rejected.map((i) => (
          <p className="warning-text small" key={i.end}>
            <TriangleAlert size={16} />
            {dateLabel(i.end, true)}: {i.reason}
          </p>
        ))}
      </Card>
      <p className="muted small bottom-note">
        Die Startfüllung zählt nicht zum Verbrauch. Alle folgenden Teilfüllungen
        und die abschließende Vollfüllung zählen mit. Die Berechnung setzt
        vollständige Tankaufzeichnungen voraus.
      </p>
    </>
  );
}
