import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Gauge,
  Wallet,
  CircleDollarSign,
  Droplets,
} from "lucide-react";
import {
  type FuelEntry,
  type FuelStation,
  type OdometerEntry,
} from "../models/types";
import { comparison, sortFuel, totals } from "../services/statistics";
import { consumption } from "../services/consumption";
import { euro, monthLabel, number } from "../utils/format";
import { Card, Empty, FuelCard, Metric } from "../components/ui";
interface Props {
  fuel: FuelEntry[];
  manual: OdometerEntry[];
  stations: FuelStation[];
  addFuel: () => void;
  addOdometer: () => void;
  open: (e: FuelEntry) => void;
  showLog: () => void;
}
export function Dashboard({
  fuel,
  manual,
  stations,
  addFuel,
  addOdometer,
  open,
  showLog,
}: Props) {
  const all = totals(fuel),
    now = new Date(),
    month = comparison(fuel, now.getFullYear(), now.getMonth()),
    usage = consumption(fuel, manual);
  const recent = sortFuel(fuel, "newest").slice(0, 3);
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">DEIN TANKBUCH. DEIN ÜBERBLICK.</span>
        <h1>
          Alles im Blick<span className="accent">.</span>
        </h1>
        <p>Ein gutes Gefühl bei jedem Kilometer.</p>
      </div>
      <Card className="hero-card">
        <div className="row">
          <span className="hero-caption">
            <Wallet size={18} /> Gesamtausgaben
          </span>
          <span className="pill">Alle Zeit</span>
        </div>
        <div className="hero-value">{euro(all.cost)}</div>
        <div className="hero-footer">
          <span>
            {number(all.liters)} <span>Liter getankt</span>
          </span>
          <i />
          <span>
            {all.count} <span>Tankvorgänge</span>
          </span>
        </div>
        <div className="hero-decoration" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </Card>
      <div className="section-heading">
        <h2>Dieser Monat</h2>
        <span className="muted small">
          {monthLabel(now.getFullYear(), now.getMonth())}
        </span>
      </div>
      <div className="metrics-grid">
        <Metric
          label="Tankkosten"
          value={euro(month.current.cost)}
          icon={<CircleDollarSign size={19} />}
          detail={`${month.current.count} Tankvorgänge · ${number(month.current.liters)} L`}
        />
        <Metric
          label="Ø Literpreis"
          value={
            <>
              {all.average ? number(all.average, 3) : "—"} <small>€/L</small>
            </>
          }
          icon={<Droplets size={19} />}
          detail="Gewichtet · alle Tankvorgänge"
        />
      </div>
      <div className="comparison-strip">
        {month.difference.lte(0) ? (
          <ArrowDownRight size={19} />
        ) : (
          <ArrowUpRight size={19} />
        )}
        <span>
          <strong>
            {month.difference.gt(0) ? "+" : ""}
            {euro(month.difference)}
          </strong>{" "}
          zum Vormonat
          {month.percent !== null
            ? ` (${month.percent.gt(0) ? "+" : ""}${number(month.percent, 1)} %)`
            : ""}
          <small>Laufender Monat · Vergleich noch unvollständig</small>
        </span>
      </div>
      <Card className="consumption-card">
        <span className="round-icon">
          <Gauge size={24} />
        </span>
        <div>
          <span className="muted small">Dein Verbrauch</span>
          <strong>
            {usage.average
              ? `${number(usage.average, 1)} L/100 km`
              : "Noch offen"}
          </strong>
          <p>
            {usage.average
              ? `${number(usage.distance, 0)} km aus gültigen Volltank-Intervallen`
              : "Noch nicht genügend Volltank-Daten vorhanden."}
          </p>
        </div>
        {usage.costPer100 && (
          <span className="consumption-cost">
            {euro(usage.costPer100)}
            <small>/100 km</small>
          </span>
        )}
      </Card>
      <div className="quick-actions">
        <button className="primary" onClick={addFuel}>
          <Plus size={20} /> Tankvorgang hinzufügen
        </button>
        <button className="secondary" onClick={addOdometer}>
          <Gauge size={19} /> Kilometerstand eintragen
        </button>
      </div>
      <div className="section-heading">
        <h2>Zuletzt getankt</h2>
        <button className="text-button" onClick={showLog}>
          Alle ansehen <ArrowRight size={15} />
        </button>
      </div>
      {recent.length ? (
        <Card className="list-card">
          {recent.map((e) => (
            <FuelCard
              key={e.id}
              entry={e}
              stations={stations}
              onClick={() => open(e)}
            />
          ))}
        </Card>
      ) : (
        <Card>
          <Empty
            title="Willkommen bei Tankmo"
            text="Erfasse deinen ersten Tankvorgang und behalte deine Tankkosten im Blick."
            action={
              <button className="text-button" onClick={addFuel}>
                Ersten Tankvorgang hinzufügen <ArrowRight size={16} />
              </button>
            }
          />
        </Card>
      )}
      <p className="privacy-footnote">
        <span /> Nur auf deinem Gerät. Immer für dich.
      </p>
    </>
  );
}
