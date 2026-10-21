import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  type FuelEntry,
  type OdometerEntry,
  type FuelStation,
  fuelNames,
} from "../models/types";
import {
  comparison,
  inMonth,
  monthly,
  sortFuel,
  totals,
} from "../services/statistics";
import { consumption } from "../services/consumption";
import { dateLabel, euro, monthLabel, number, price } from "../utils/format";
import { Card, Empty, Metric } from "../components/ui";
const ranges = [
  ["30", "30 Tage"],
  ["3", "3 Monate"],
  ["6", "6 Monate"],
  ["12", "12 Monate"],
  ["all", "Gesamt"],
];
export function Statistics({
  fuel,
  manual,
  stations,
}: {
  fuel: FuelEntry[];
  manual: OdometerEntry[];
  stations: FuelStation[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear()),
    [month, setMonth] = useState(today.getMonth());
  const [range, setRange] = useState("all"),
    [type, setType] = useState("all");
  const all = totals(fuel),
    selected = comparison(fuel, year, month),
    usage = consumption(fuel, manual);
  const years = [
    ...new Set([
      today.getFullYear(),
      year,
      ...fuel.map((f) => new Date(f.date).getFullYear()),
    ]),
  ].sort((a, b) => b - a);
  const oldest = sortFuel(fuel, "oldest")[0],
    latest = sortFuel(fuel, "newest")[0];
  const history = useMemo(() => {
    const start = new Date();
    if (range === "30") start.setDate(start.getDate() - 30);
    else if (range !== "all") start.setMonth(start.getMonth() - Number(range));
    return sortFuel(
      fuel.filter(
        (f) =>
          (type === "all" || type === f.fuelType) &&
          (range === "all" || new Date(f.date) >= start),
      ),
      "oldest",
    );
  }, [fuel, range, type]);
  const prices = history.map((f) => ({
    time: new Date(f.date).getTime(),
    price: price(f).toNumber(),
    fuel: fuelNames[f.fuelType],
  }));
  const histTotals = totals(history);
  const priceValues = history.map(price).sort((a, b) => a.cmp(b));
  const stationGroups = Object.keys(fuelNames).map((key) => {
    const rows = stations
      .map((s) => ({
        station: s,
        totals: totals(
          fuel.filter((f) => f.stationId === s.id && f.fuelType === key),
        ),
      }))
      .filter((s) => s.totals.count)
      .sort((a, b) => a.totals.average!.cmp(b.totals.average!));
    return { key, rows };
  });
  const frequent = [...stations].sort(
    (a, b) =>
      fuel.filter((f) => f.stationId === b.id).length -
      fuel.filter((f) => f.stationId === a.id).length,
  )[0];
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">WENIGER RÄTSELN. MEHR WISSEN.</span>
        <h1>Deine Statistiken</h1>
        <p>Aus Tankfüllungen werden Einsichten.</p>
      </div>
      {!fuel.length && (
        <Card>
          <Empty
            title="Dein Überblick wächst mit dir"
            text="Hier erscheinen deine Statistiken, sobald du Tankvorgänge erfasst hast."
          />
        </Card>
      )}
      <div className="section-heading">
        <h2>Alle Zeit</h2>
        <span className="muted small">{all.count} Tankvorgänge</span>
      </div>
      <div className="metrics-grid">
        <Metric
          label="Gesamtausgaben"
          value={euro(all.cost)}
          detail={`${number(all.liters)} Liter insgesamt`}
        />
        <Metric
          label="Ø Literpreis"
          value={all.average ? `${number(all.average, 3)} €/L` : "—"}
          detail="Gewichtet nach Litern"
        />
      </div>
      {oldest && latest && (
        <p className="muted small">
          Erster Tankvorgang: {dateLabel(oldest.date, true)} · Letzter:{" "}
          {dateLabel(latest.date, true)}
        </p>
      )}
      <div className="section-heading">
        <h2>Tankkosten im Jahr</h2>
        <label className="compact-label">
          <span className="sr-only">Jahr</span>
          <input
            aria-label="Jahr"
            type="number"
            min="1"
            max="9999"
            list="years"
            value={year}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= 9999) setYear(n);
            }}
          />
          <datalist id="years">
            {years.map((y) => (
              <option key={y} value={y} />
            ))}
          </datalist>
        </label>
      </div>
      <Card className="chart-card">
        <div className="row chart-heading">
          <div>
            <span className="muted small">{monthLabel(year, month)}</span>
            <h3>{euro(selected.current.cost)}</h3>
          </div>
          <span className="pill blue">{number(selected.current.liters)} L</span>
        </div>
        <div
          className="chart"
          role="img"
          aria-label={`Monatliche Tankkosten ${year} in Euro. Die Werte sind unter dem Diagramm auswählbar.`}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
          >
            <BarChart
              data={monthly(fuel, year)}
              margin={{ left: -22, right: 0, top: 8, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 5"
                stroke="var(--line)"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                interval={1}
              />
              <YAxis
                domain={[0, "auto"]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "var(--accent-soft)" }}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  color: "var(--text)",
                }}
                formatter={(v) => [euro(Number(v)), "Tankkosten"]}
              />
              <Bar
                dataKey="cost"
                fill="var(--accent)"
                radius={[5, 5, 2, 2]}
                maxBarSize={28}
                isAnimationActive={false}
                onClick={(_d, index) => setMonth(index)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <label>
          Monat
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {monthly(fuel, year).map((m) => (
              <option key={m.month} value={m.month}>
                {monthLabel(year, m.month)} · {euro(m.cost)}
              </option>
            ))}
          </select>
        </label>
        <div className="stats-summary">
          <span>
            <strong>{selected.current.count}</strong> Tankvorgänge
          </span>
          <span>
            <strong>
              {selected.current.average
                ? `${number(selected.current.average, 3)} €`
                : "—"}
            </strong>{" "}
            Ø pro Liter
          </span>
        </div>
      </Card>
      <Card className="comparison-card">
        <h3>Zum Vormonat</h3>
        <div className="data-row">
          <span>Ausgaben</span>
          <strong>
            {selected.difference.gt(0) ? "+" : ""}
            {euro(selected.difference)}
            {selected.percent !== null
              ? ` (${number(selected.percent, 1)} %)`
              : " · kein Prozentvergleich"}
          </strong>
        </div>
        <div className="data-row">
          <span>Liter</span>
          <strong>
            {number(selected.current.liters.minus(selected.prior.liters))} L
          </strong>
        </div>
        <div className="data-row">
          <span>Ø Literpreis</span>
          <strong>
            {selected.current.average && selected.prior.average
              ? `${number(selected.current.average.minus(selected.prior.average), 3)} €/L`
              : "—"}
          </strong>
        </div>
        {year === today.getFullYear() && month === today.getMonth() && (
          <p className="muted small">Der aktuelle Monat läuft noch.</p>
        )}
      </Card>
      <div className="section-heading">
        <h2>Literpreis im Verlauf</h2>
      </div>
      <div className="segmented range-selector">
        {ranges.map(([id, label]) => (
          <button
            className={range === id ? "active" : ""}
            key={id}
            onClick={() => setRange(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="filter-label">
        Kraftstoff
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Alle Kraftstoffarten</option>
          {Object.entries(fuelNames).map(([id, n]) => (
            <option key={id} value={id}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <Card className="chart-card">
        {prices.length ? (
          <>
            <div className="chart">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={1}
                minHeight={1}
              >
                <LineChart
                  data={prices}
                  margin={{ left: -14, right: 12, top: 12, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 5"
                    stroke="var(--line)"
                  />
                  <XAxis
                    dataKey="time"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => number(v, 2)}
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    labelFormatter={(v) =>
                      dateLabel(new Date(Number(v)).toISOString())
                    }
                    formatter={(v) => [
                      `${number(Number(v), 3)} €/L`,
                      "Literpreis",
                    ]}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 16,
                      color: "var(--text)",
                    }}
                  />
                  <Line
                    dataKey="price"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="price-summary">
              <span>
                Tiefstpreis<strong>{number(priceValues[0], 3)} €</strong>
              </span>
              <span>
                Höchstpreis<strong>{number(priceValues.at(-1)!, 3)} €</strong>
              </span>
              <span>
                Zuletzt<strong>{number(price(history.at(-1)!), 3)} €</strong>
              </span>
              <span>
                Gewichteter Ø<strong>{number(histTotals.average!, 3)} €</strong>
              </span>
            </div>
            <details>
              <summary>Preisdaten als Liste</summary>
              {history.map((f) => (
                <div className="data-row small" key={f.id}>
                  <span>
                    {dateLabel(f.date, true)} · {fuelNames[f.fuelType]}
                  </span>
                  <strong>{number(price(f), 3)} €/L</strong>
                </div>
              ))}
            </details>
          </>
        ) : (
          <p className="muted">Keine Tankvorgänge im ausgewählten Zeitraum.</p>
        )}
      </Card>
      <div className="section-heading">
        <h2>Nach Kraftstoff</h2>
      </div>
      <Card>
        {Object.entries(fuelNames).map(([id, name]) => {
          const t = totals(fuel.filter((f) => f.fuelType === id));
          return (
            <div className="data-row" key={id}>
              <div>
                <strong>{name}</strong>
                <small>
                  {t.count} Tankvorgänge · {number(t.liters)} L
                </small>
              </div>
              <div className="align-right">
                <strong>{euro(t.cost)}</strong>
                <small>{t.average ? `${number(t.average, 3)} €/L` : "—"}</small>
              </div>
            </div>
          );
        })}
      </Card>
      <div className="section-heading">
        <h2>Deine Tankstellen</h2>
      </div>
      <Card>
        {frequent && fuel.some((f) => f.stationId === frequent.id) ? (
          <p className="muted small">
            Am häufigsten: <strong>{frequent.name}</strong>
          </p>
        ) : (
          <p className="muted">
            Ordne Tankvorgänge einer Tankstelle zu, um sie zu vergleichen.
          </p>
        )}
        {stations.map((station) => {
          const summary = totals(
            fuel.filter((f) => f.stationId === station.id),
          );
          return (
            summary.count > 0 && (
              <div className="data-row" key={station.id}>
                <div>
                  <strong>
                    {station.name}
                    {station.deleted ? " (archiviert)" : ""}
                  </strong>
                  <small>
                    {summary.count} Einträge · {number(summary.liters)} L
                    insgesamt
                  </small>
                </div>
                <strong>{euro(summary.cost)}</strong>
              </div>
            )
          );
        })}
        {stationGroups.some((g) => g.rows.length > 0) && (
          <p className="muted small">Preisvergleich nach Kraftstoffart</p>
        )}
        {stationGroups
          .filter((g) => g.rows.length)
          .map((g) => (
            <div key={g.key}>
              <h3>{fuelNames[g.key as keyof typeof fuelNames]}</h3>
              {g.rows.map((r, i) => (
                <div className="data-row" key={r.station.id}>
                  <div>
                    <strong>{r.station.name}</strong>
                    <small>
                      {r.totals.count} Einträge · {number(r.totals.liters)} L ·{" "}
                      {euro(r.totals.cost)}
                    </small>
                    {i === 0 && (
                      <small className="accent">
                        Günstigster aufgezeichneter Durchschnitt
                      </small>
                    )}
                  </div>
                  <strong>{number(r.totals.average!, 3)} €/L</strong>
                </div>
              ))}
            </div>
          ))}
        <p className="muted small">
          Historische Aufzeichnungen, keine aktuellen Live-Preise. Vergleich nur
          innerhalb derselben Kraftstoffart.
        </p>
      </Card>
      <div className="section-heading">
        <h2>Verbrauch & Strecke</h2>
      </div>
      <div className="metrics-grid">
        <Metric
          label="Gewichteter Verbrauch"
          value={usage.average ? `${number(usage.average, 1)} L/100 km` : "—"}
          detail={`${number(usage.distance, 0)} km in gültigen Intervallen`}
        />
        <Metric
          label="Kraftstoffkosten"
          value={usage.costPer100 ? `${euro(usage.costPer100)}` : "—"}
          detail="pro 100 km · gültige Intervalle"
        />
      </div>
      <Card>
        {usage.intervals.length ? (
          <>
            <div className="chart">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={1}
                minHeight={1}
              >
                <LineChart
                  data={usage.intervals.map((i) => ({
                    time: new Date(i.end).getTime(),
                    value: Number(i.consumption),
                    cost: Number(i.costPer100),
                  }))}
                >
                  <XAxis
                    dataKey="time"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="usage"
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    width={35}
                  />
                  <YAxis
                    yAxisId="cost"
                    orientation="right"
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    width={35}
                  />
                  <Tooltip
                    labelFormatter={(v) =>
                      dateLabel(new Date(Number(v)).toISOString())
                    }
                    formatter={(v, key) =>
                      key === "cost"
                        ? [`${euro(Number(v))}/100 km`, "Kosten"]
                        : [`${number(Number(v), 1)} L/100 km`, "Verbrauch"]
                    }
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: 16,
                      color: "var(--text)",
                    }}
                  />
                  <Line
                    dataKey="value"
                    yAxisId="usage"
                    stroke="var(--accent)"
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="cost"
                    yAxisId="cost"
                    stroke="var(--success)"
                    strokeDasharray="4 4"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="muted small">
              Blau: Verbrauch (L/100 km, links) · Grün gestrichelt: Kosten
              (€/100 km, rechts)
            </p>
            {usage.intervals.map((i) => (
              <div className="data-row small" key={i.end}>
                <span>
                  {dateLabel(i.end, true)}
                  <small>
                    {number(i.distance, 0)} km · {number(i.liters)} L
                  </small>
                </span>
                <strong>
                  {number(i.consumption, 1)} L/100 km
                  <small>{euro(i.costPer100)} /100 km</small>
                </strong>
              </div>
            ))}
          </>
        ) : (
          <p className="muted">
            Für die Verbrauchsberechnung benötigst du mindestens zwei geeignete
            Volltank-Einträge mit Kilometerstand.
          </p>
        )}
      </Card>
      <details className="bottom-note">
        <summary>Tankvorgänge im ausgewählten Monat</summary>
        {inMonth(fuel, year, month).map((f) => (
          <div className="data-row" key={f.id}>
            <span>{dateLabel(f.date, true)}</span>
            <strong>{euro(f.totalCost)}</strong>
          </div>
        ))}
      </details>
    </>
  );
}
