import { useRef, useState } from "react";
import {
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  HardDrive,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { db } from "../db/database";
import { writeLocal, clearLocalData as clearData } from "../db/persistence";
import { isIOSApp } from "../platform/native";
import {
  type AppSettings,
  type FuelStation,
  type Backup,
  fuelNames,
  meta,
} from "../models/types";
import {
  fromCSV,
  parseBackup,
  previewImport,
  restore,
  shareFile,
  snapshot,
  toCSV,
  type ImportPolicy,
} from "../services/transfer";
import { Card, Sheet } from "../components/ui";
import { dateLabel, number } from "../utils/format";
export function Settings({
  settings,
  stations,
  count,
  onSettings,
  notify,
  offlineReady,
}: {
  settings: AppSettings;
  stations: FuelStation[];
  count: number;
  onSettings: (patch: Partial<AppSettings>) => void;
  notify: (text: string) => void;
  offlineReady: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"csv" | "json">("json");
  const [pending, setPending] = useState<{
    backup: Backup;
    duplicates: number;
    conflicts: number;
    total: number;
  } | null>(null);
  const [policy, setPolicy] = useState<ImportPolicy>("skip");
  const [busy, setBusy] = useState(false);
  const [station, setStation] = useState<FuelStation | null | undefined>(
    undefined,
  );
  const [name, setName] = useState(""),
    [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [importError, setImportError] = useState("");
  const [storage, setStorage] = useState("");
  async function exportData(format: "csv" | "json") {
    setBusy(true);
    try {
      const data = await snapshot();
      const stamp = new Date().toISOString().slice(0, 10);
      const saved = await shareFile(
        format === "csv" ? toCSV(data) : JSON.stringify(data, null, 2),
        `Tankmo-${stamp}.${format}`,
        format === "csv" ? "text/csv;charset=utf-8" : "application/json",
      );
      if (saved && format === "json")
        await writeLocal(() =>
          db.settings.update("main", {
            lastBackup: new Date().toISOString(),
          }),
        );
      if (saved) notify("Datei zum Speichern bereitgestellt.");
    } catch {
      notify("Export fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const backup = kind === "csv" ? fromCSV(text) : parseBackup(text);
      const preview = await previewImport(backup);
      setPolicy("skip");
      setImportError("");
      setPending({ backup, ...preview });
    } catch (e) {
      notify(e instanceof Error ? e.message : "Import fehlgeschlagen.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function applyImport() {
    if (!pending) return;
    if (
      policy === "replace" &&
      !confirm(
        "Alle vorhandenen Daten durch diese Sicherung ersetzen? Dieser Schritt kann nicht rückgängig gemacht werden.",
      )
    )
      return;
    setBusy(true);
    setImportError("");
    try {
      const result = await restore(pending.backup, policy);
      setPending(null);
      notify(
        `${result.imported} Datensätze importiert, ${result.skipped} vorhandene übersprungen. Wiederherstellung geprüft.`,
      );
    } catch {
      setImportError(
        "Import fehlgeschlagen. Es wurden keine Änderungen übernommen. Bitte freien Speicherplatz prüfen und erneut versuchen.",
      );
    } finally {
      setBusy(false);
    }
  }
  const editStation = (s: FuelStation | null) => {
    setStation(s);
    setName(s?.name ?? "");
    setLocation(s?.locationDescription ?? "");
    setError("");
  };
  async function saveStation(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Bitte einen Namen eingeben.");
      return;
    }
    setBusy(true);
    try {
      await writeLocal(() =>
        db.stations.put({
          ...(station ?? meta()),
          name: name.trim(),
          locationDescription: location.trim() || undefined,
          updatedAt: new Date().toISOString(),
        }),
      );
      setStation(undefined);
      notify("Tankstelle gespeichert.");
    } catch {
      setError("Tankstelle konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">GANZ NACH DEINEM GEFÜHL</span>
        <h1>Einstellungen</h1>
        <p>Dein Tankmo. Deine Daten. Deine Entscheidung.</p>
      </div>
      <div className="section-heading">
        <h2>Erscheinungsbild</h2>
      </div>
      <Card>
        <div className="segmented theme-selector">
          {(
            [
              { id: "auto", label: "Automatisch", Icon: Monitor },
              { id: "light", label: "Hell", Icon: Sun },
              { id: "dark", label: "Dunkel", Icon: Moon },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              className={settings.appearance === id ? "active" : ""}
              onClick={() => onSettings({ appearance: id })}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </div>
      </Card>
      <div className="section-heading">
        <h2>Beim Tanken</h2>
      </div>
      <Card>
        <label>
          Standard-Kraftstoff
          <select
            value={settings.defaultFuelType}
            onChange={(e) =>
              onSettings({
                defaultFuelType: e.target
                  .value as AppSettings["defaultFuelType"],
              })
            }
          >
            {Object.entries(fuelNames).map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </Card>
      <div className="section-heading">
        <h2>Tankstellen</h2>
        <button className="text-button" onClick={() => editStation(null)}>
          <Plus size={16} /> Hinzufügen
        </button>
      </div>
      <Card className="stations-card">
        {stations.filter((s) => !s.deleted).length ? (
          stations
            .filter((s) => !s.deleted)
            .map((s) => (
              <div className="data-row" key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  {s.locationDescription && (
                    <small>{s.locationDescription}</small>
                  )}
                </div>
                <div className="row">
                  <button
                    className="icon-button"
                    aria-label={`${s.name} bearbeiten`}
                    onClick={() => editStation(s)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`${s.name} löschen`}
                    onClick={async () => {
                      if (
                        confirm(
                          "Tankstelle löschen? Historische Tankvorgänge und der Tankstellenname bleiben erhalten.",
                        )
                      )
                        try {
                          await writeLocal(() =>
                            db.stations.update(s.id, {
                              deleted: true,
                              updatedAt: new Date().toISOString(),
                            }),
                          );
                          notify("Tankstelle archiviert.");
                        } catch {
                          notify("Löschen fehlgeschlagen.");
                        }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
        ) : (
          <p className="muted">
            Speichere deine Lieblingstankstellen. Ganz ohne Standortfreigabe.
          </p>
        )}
      </Card>
      <div className="section-heading">
        <h2>Daten & Sicherung</h2>
      </div>
      <Card className="backup-guidance">
        <ShieldCheck size={24} />
        <div>
          <h3>Deine Daten verdienen ein Backup.</h3>
          <p>
            Alles bleibt auf diesem Gerät. Sichere regelmäßig ein vollständiges
            Backup in „Dateien“, z. B. in iCloud Drive. Das ist eine manuelle
            Sicherung, keine automatische Synchronisierung.
          </p>
          {settings.lastBackup ? (
            <small>
              Letzter Backup-Export: {dateLabel(settings.lastBackup)}
            </small>
          ) : (
            count > 0 && (
              <small className="accent">
                Du hast noch kein vollständiges Backup exportiert.
              </small>
            )
          )}
        </div>
      </Card>
      <Card className="list-card settings-list">
        <button disabled={busy} onClick={() => exportData("json")}>
          <Download />
          <span>
            Vollständiges Backup exportieren
            <small>Alle Einträge, Tankstellen und Einstellungen</small>
          </span>
          <ChevronRight />
        </button>
        <button
          disabled={busy}
          onClick={() => {
            setKind("json");
            if (fileRef.current) {
              fileRef.current.accept = ".json,application/json";
              fileRef.current.click();
            }
          }}
        >
          <Upload />
          <span>
            Backup wiederherstellen
            <small>Vorab prüfen, dann sicher übernehmen</small>
          </span>
          <ChevronRight />
        </button>
        <button disabled={busy} onClick={() => exportData("csv")}>
          <Download />
          <span>
            CSV exportieren<small>Versioniertes Tankmo-Format</small>
          </span>
          <ChevronRight />
        </button>
        <button
          disabled={busy}
          onClick={() => {
            setKind("csv");
            if (fileRef.current) {
              fileRef.current.accept = ".csv,text/csv";
              fileRef.current.click();
            }
          }}
        >
          <Upload />
          <span>
            CSV importieren<small>Mit Dubletten- und Konfliktprüfung</small>
          </span>
          <ChevronRight />
        </button>
      </Card>
      <input
        className="sr-only"
        ref={fileRef}
        type="file"
        onChange={(e) => importFile(e.target.files?.[0])}
        aria-label="Importdatei"
      />
      <Card>
        <h3>
          <HardDrive size={18} /> Lokaler Speicher
        </h3>
        <p className="muted small">
          {isIOSApp ? "Automatisch im App-Speicher" : "IndexedDB"} ·
          Datenbankschema 1 · {count} Tankvorgänge
        </p>
        <p className="muted small">
          {isIOSApp
            ? "Nach „Speichern“ liegen deine Einträge automatisch lokal auf diesem iPhone und werden beim nächsten Start geladen. Beim Löschen der App können ihre Daten verloren gehen. Ein Export ist deine unabhängige Sicherung."
            : "Browserdaten können durch Aufräumen, Speichermangel oder das Betriebssystem verloren gehen. Ein Export ist deine unabhängige Sicherung."}
        </p>
        <button
          className="secondary"
          onClick={async () => {
            if (isIOSApp) {
              setStorage(
                "Die lokale App-Datei wird nach jeder bestätigten Änderung automatisch aktualisiert. Dafür ist keine Internetverbindung nötig.",
              );
              return;
            }
            try {
              const granted = await navigator.storage?.persist?.();
              const estimate = await navigator.storage?.estimate?.();
              setStorage(
                `${granted ? "Dauerhafte Speicherung angefragt und gewährt." : "Dauerhafte Speicherung nicht gewährt oder nicht unterstützt. Die App bleibt nutzbar."}${estimate?.usage ? ` Belegt: ${number(estimate.usage / 1024 / 1024)} MB.` : ""}`,
              );
            } catch {
              setStorage(
                "Speicherinformationen sind in diesem Browser nicht verfügbar.",
              );
            }
          }}
        >
          Speicherstatus prüfen
        </button>
        {storage && (
          <p className="muted small" role="status">
            {storage}
          </p>
        )}
      </Card>
      <button
        className="danger delete-all"
        disabled={busy}
        onClick={async () => {
          if (
            confirm(
              "Alle lokalen Tankmo-Daten löschen? Bitte zuvor ein Backup exportieren.",
            ) &&
            confirm(
              "Wirklich unwiderruflich alle Einträge, Kilometerstände, Tankstellen und Einstellungen löschen?",
            )
          )
            try {
              await clearData();
              notify("Alle lokalen Daten gelöscht.");
            } catch {
              notify("Löschen fehlgeschlagen.");
            }
        }}
      >
        <Trash2 size={17} /> Alle lokalen Daten löschen
      </button>
      <div className="app-info">
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt=""
          width="52"
          height="52"
        />
        <h3>
          Tankmo <span>1.0.0</span>
        </h3>
        <p>Mit jedem Kilometer ein besserer Überblick.</p>
        <small>
          {isIOSApp
            ? "iPhone-App · App-Dateien und Einträge lokal verfügbar."
            : offlineReady
              ? "App für die Offline-Nutzung bereit."
              : "Offline-Cache noch nicht bestätigt. Einmal online vollständig laden."}
          <br />
          Privat. Ohne Konto. Ohne Tracking.
        </small>
      </div>
      {station !== undefined && (
        <Sheet
          title={station ? "Tankstelle bearbeiten" : "Neue Tankstelle"}
          onClose={() => {
            if (
              confirm(
                "Tankstellenformular schließen? Ungespeicherte Änderungen gehen verloren.",
              )
            )
              setStation(undefined);
          }}
        >
          <form className="entry-form" onSubmit={saveStation}>
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="organization"
              />
            </label>
            <label>
              Ort / Beschreibung (optional)
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              Tankstelle speichern
            </button>
          </form>
        </Sheet>
      )}
      {pending && (
        <Sheet
          title="Import prüfen"
          onClose={() => {
            if (!busy) setPending(null);
          }}
        >
          <div className="entry-form">
            <p>
              {pending.backup.fuel.length} Tankvorgänge ·{" "}
              {pending.backup.odometer.length} Kilometerstände ·{" "}
              {pending.backup.stations.length} Tankstellen
            </p>
            <p className="muted">
              {pending.duplicates} vorhandene UUIDs, davon {pending.conflicts}{" "}
              abweichende Datensätze. {pending.total - pending.duplicates} neue
              Datensätze.
            </p>
            <label>
              Importverfahren
              <select
                value={policy}
                onChange={(e) => setPolicy(e.target.value as ImportPolicy)}
              >
                <option value="skip">
                  Zusammenführen · vorhandene IDs überspringen
                </option>
                <option value="overwrite">
                  Zusammenführen · vorhandene IDs überschreiben
                </option>
                <option value="replace">Alle vorhandenen Daten ersetzen</option>
              </select>
            </label>
            <p className="muted small">
              {policy === "replace"
                ? "Alle lokalen Daten und Einstellungen werden durch die Sicherung ersetzt."
                : "Einstellungen auf diesem Gerät bleiben erhalten."}{" "}
              {policy === "overwrite"
                ? "Abweichende Einträge mit gleicher UUID werden ausdrücklich ersetzt."
                : "Es entstehen keine Dubletten mit gleicher UUID."}
            </p>
            <details>
              <summary>Vorschau der Tankvorgänge</summary>
              {pending.backup.fuel.slice(0, 10).map((f) => (
                <p className="small" key={f.id}>
                  {dateLabel(f.date, true)} · {fuelNames[f.fuelType]} ·{" "}
                  {number(f.liters)} L · {number(f.totalCost)} €
                </p>
              ))}
              {pending.backup.fuel.length > 10 && (
                <p className="small">
                  Weitere {pending.backup.fuel.length - 10} Einträge …
                </p>
              )}
            </details>
            <button
              className={
                policy === "replace" ? "primary destructive" : "primary"
              }
              onClick={applyImport}
              disabled={busy}
            >
              {busy ? "Import läuft …" : "Import bestätigen"}
            </button>
            {importError && (
              <p className="error" role="alert">
                {importError}
              </p>
            )}
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              Abbrechen
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
