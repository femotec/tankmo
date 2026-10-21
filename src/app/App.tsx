import {
  useEffect,
  useRef,
  useState,
  Component,
  type ReactNode,
  type ErrorInfo,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  House,
  Fuel,
  ChartColumn,
  Gauge,
  Settings as SettingsIcon,
  ArrowUpRight,
  ShieldCheck,
  WifiOff,
  Check,
  Trash2,
  Pencil,
  Download,
} from "lucide-react";
import { registerSW } from "virtual:pwa-register";
import { db, deleteFuel, initialize } from "../db/database";
import {
  defaultSettings,
  fuelNames,
  type AppSettings,
  type FuelEntry,
  type OdometerEntry,
} from "../models/types";
import { dateLabel, euro, number, price, timeLabel } from "../utils/format";
import { Dashboard } from "../features/Dashboard";
import { FuelLog } from "../features/FuelLog";
import { Odometer } from "../features/Odometer";
import { Statistics } from "../features/Statistics";
import { Settings } from "../features/Settings";
import { EntryForm } from "../features/EntryForm";
import { Sheet } from "../components/ui";
const tabs = [
  { id: "dashboard", label: "Dashboard", Icon: House },
  { id: "log", label: "Tankbuch", Icon: Fuel },
  { id: "statistics", label: "Statistiken", Icon: ChartColumn },
  { id: "odometer", label: "Kilometerstände", Icon: Gauge },
  { id: "settings", label: "Einstellungen", Icon: SettingsIcon },
] as const;
type Tab = (typeof tabs)[number]["id"];
type Modal =
  | { kind: "fuel"; entry?: FuelEntry }
  | { kind: "odometer"; entry?: OdometerEntry }
  | { kind: "detail"; entry: FuelEntry };
export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard"),
    [modal, setModal] = useState<Modal | null>(null),
    [toast, setToast] = useState(""),
    [initError, setInitError] = useState(""),
    [ready, setReady] = useState(false),
    [online, setOnline] = useState(navigator.onLine),
    [offlineReady, setOfflineReady] = useState(false),
    [update, setUpdate] = useState<(() => void) | null>(null);
  const scroll = useRef<Partial<Record<Tab, number>>>({});
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const data = useLiveQuery(
    async () =>
      db.transaction(
        "r",
        [db.fuel, db.odometer, db.stations, db.settings],
        async () => ({
          fuel: await db.fuel.toArray(),
          manual: await db.odometer.toArray(),
          stations: await db.stations.toArray(),
          settings: (await db.settings.get("main")) ?? defaultSettings,
        }),
      ),
    [],
  );
  const settings = data?.settings ?? defaultSettings;
  useEffect(() => {
    initialize()
      .then(() => {
        setReady(true);
        navigator.storage?.persist?.().catch(() => {});
      })
      .catch(() =>
        setInitError(
          "Tankmo kann den lokalen Speicher nicht öffnen. Bitte erlaube Browser-Speicher und prüfe den freien Speicherplatz. Bestehende Daten werden nicht gelöscht.",
        ),
      );
  }, []);
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine);
    window.addEventListener("online", changed);
    window.addEventListener("offline", changed);
    const updater = registerSW({
      onOfflineReady: () => setOfflineReady(true),
      onNeedRefresh: () =>
        setUpdate(() => () => {
          void updater(true);
        }),
      onRegisterError: () => setOfflineReady(false),
    });
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .getRegistration()
        .then((r) => {
          if (r?.active) setOfflineReady(true);
        })
        .catch(() => {});
    return () => {
      window.removeEventListener("online", changed);
      window.removeEventListener("offline", changed);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.appearance;
  }, [settings.appearance]);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6000);
  };
  const changeSettings = (patch: Partial<AppSettings>) => {
    db.settings
      .put({ ...settings, ...patch })
      .catch(() => notify("Einstellung konnte nicht gespeichert werden."));
  };
  const changeTab = (next: Tab) => {
    scroll.current[tab] = window.scrollY;
    setTab(next);
    requestAnimationFrame(() =>
      window.scrollTo({ top: scroll.current[next] ?? 0, behavior: "instant" }),
    );
  };
  const closeModal = () => setModal(null);
  const sheetClose = () => {
    if (
      modal?.kind === "detail" ||
      confirm("Formular schließen? Ungespeicherte Änderungen gehen verloren.")
    )
      closeModal();
  };
  if (initError)
    return (
      <main className="startup">
        <ShieldCheck size={38} />
        <h1>Deine Daten sind wichtig.</h1>
        <p role="alert">{initError}</p>
        <button className="primary" onClick={() => location.reload()}>
          Erneut versuchen
        </button>
      </main>
    );
  if (!ready || !data)
    return (
      <main className="startup">
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          width="72"
          height="72"
          alt="Tankmo"
        />
        <p>Dein Tankbuch wird geöffnet …</p>
      </main>
    );
  const detail =
    modal?.kind === "detail"
      ? data.fuel.find((f) => f.id === modal.entry.id)
      : undefined;
  return (
    <>
      <header className="app-header">
        <button
          className="brand"
          onClick={() => changeTab("dashboard")}
          aria-label="Tankmo Dashboard"
        >
          <span>
            <Fuel size={23} />
          </span>
          tankmo<span className="brand-dot">.</span>
        </button>
        <span className="header-status">
          {online ? (
            <>
              <span className="status-dot" /> Dein persönliches Tankbuch
            </>
          ) : (
            <>
              <WifiOff size={14} /> Offline · lokal gespeichert
            </>
          )}
        </span>
        <button
          className="profile-button"
          aria-label="Einstellungen öffnen"
          onClick={() => changeTab("settings")}
        >
          <ShieldCheck size={20} />
        </button>
      </header>
      <main className="app-main">
        {update && (
          <div className="update-banner">
            <Download size={18} />
            <span>Eine neue Tankmo-Version ist bereit.</span>
            <button
              onClick={() => {
                if (
                  !modal ||
                  confirm(
                    "Update laden? Ungespeicherte Formulardaten gehen verloren.",
                  )
                )
                  update();
              }}
            >
              Jetzt aktualisieren
            </button>
          </div>
        )}
        <div hidden={tab !== "dashboard"}>
          <Dashboard
            fuel={data.fuel}
            manual={data.manual}
            stations={data.stations}
            addFuel={() => setModal({ kind: "fuel" })}
            addOdometer={() => setModal({ kind: "odometer" })}
            open={(entry) => setModal({ kind: "detail", entry })}
            showLog={() => changeTab("log")}
          />
        </div>
        <div hidden={tab !== "log"}>
          <FuelLog
            fuel={data.fuel}
            stations={data.stations}
            settings={settings}
            onSort={(preferredTankbookSort) =>
              changeSettings({ preferredTankbookSort })
            }
            open={(entry) => setModal({ kind: "detail", entry })}
            add={() => setModal({ kind: "fuel" })}
          />
        </div>
        <div hidden={tab !== "statistics"}>
          <Statistics
            fuel={data.fuel}
            manual={data.manual}
            stations={data.stations}
          />
        </div>
        <div hidden={tab !== "odometer"}>
          <Odometer
            fuel={data.fuel}
            manual={data.manual}
            add={() => setModal({ kind: "odometer" })}
            edit={(entry) => setModal({ kind: "odometer", entry })}
            openFuel={(entry) => setModal({ kind: "detail", entry })}
          />
        </div>
        <div hidden={tab !== "settings"}>
          <Settings
            settings={settings}
            stations={data.stations}
            count={data.fuel.length}
            onSettings={changeSettings}
            notify={notify}
            offlineReady={offlineReady}
          />
        </div>
      </main>
      <nav className="glass-tabbar" aria-label="Hauptnavigation">
        <span
          className="tab-indicator"
          style={{
            transform: `translateX(${tabs.findIndex((t) => t.id === tab) * 100}%)`,
          }}
        />
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            className={tab === id ? "active" : ""}
            onClick={() => changeTab(id)}
          >
            <Icon size={22} strokeWidth={tab === id ? 2.3 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {modal && (
        <Sheet
          title={
            modal.kind === "detail"
              ? "Dein Tankvorgang"
              : modal.kind === "fuel"
                ? modal.entry
                  ? "Tankvorgang bearbeiten"
                  : "Tankvorgang hinzufügen"
                : modal.entry
                  ? "Kilometerstand bearbeiten"
                  : "Kilometerstand eintragen"
          }
          onClose={sheetClose}
        >
          {modal.kind === "detail" && detail ? (
            <div className="entry-detail">
              <div className="detail-hero">
                <span className="round-icon">
                  <Fuel size={30} />
                </span>
                <h3>{euro(detail.totalCost)}</h3>
                <span>
                  {fuelNames[detail.fuelType]} · {number(detail.liters)} L
                </span>
                <small>
                  {dateLabel(detail.date)} · {timeLabel(detail.date)}
                </small>
              </div>
              <div className="data-row">
                <span>Literpreis</span>
                <strong>{number(price(detail), 3)} €/L</strong>
              </div>
              <div className="data-row">
                <span>Tankstelle</span>
                <strong>
                  {data.stations.find((s) => s.id === detail.stationId)?.name ??
                    "Nicht angegeben"}
                </strong>
              </div>
              <div className="data-row">
                <span>Kilometerstand</span>
                <strong>
                  {detail.odometer !== undefined
                    ? `${number(detail.odometer, 0)} km`
                    : "Nicht angegeben"}
                </strong>
              </div>
              <div className="data-row">
                <span>Vollgetankt</span>
                <strong>
                  {detail.isFullTank === undefined
                    ? "Nicht angegeben"
                    : detail.isFullTank
                      ? "Ja"
                      : "Nein"}
                </strong>
              </div>
              {detail.dataGap && (
                <p className="warning-text">
                  Unvollständige Tankaufzeichnung vor diesem Eintrag.
                </p>
              )}
              {detail.note && <p className="detail-note">{detail.note}</p>}
              <div className="form-actions">
                <button
                  className="secondary"
                  onClick={() => setModal({ kind: "fuel", entry: detail })}
                >
                  <Pencil size={18} /> Bearbeiten
                </button>
                <button
                  className="danger secondary"
                  onClick={async () => {
                    if (
                      confirm(
                        "Tankvorgang löschen? Das folgende Verbrauchsintervall wird als unvollständig markiert.",
                      )
                    )
                      try {
                        await deleteFuel(detail.id);
                        closeModal();
                        notify("Tankvorgang gelöscht.");
                      } catch {
                        notify("Löschen fehlgeschlagen.");
                      }
                  }}
                >
                  <Trash2 size={18} /> Löschen
                </button>
              </div>
              <p className="muted small">
                Erfasst: {dateLabel(detail.createdAt, true)}
                <br />
                Zuletzt geändert: {dateLabel(detail.updatedAt, true)}
              </p>
            </div>
          ) : (
            modal.kind !== "detail" && (
              <>
                <EntryForm
                  key={`${modal.kind}-${modal.entry?.id ?? "new"}`}
                  kind={modal.kind}
                  entry={modal.entry}
                  settings={settings}
                  stations={data.stations}
                  onCancel={closeModal}
                  onSaved={() => {
                    closeModal();
                    notify("Gespeichert. Dein Überblick ist aktuell.");
                  }}
                />
                {modal.kind === "odometer" && modal.entry && (
                  <button
                    className="danger delete-odometer"
                    onClick={async () => {
                      if (confirm("Diesen Kilometerstand löschen?"))
                        try {
                          await db.odometer.delete(modal.entry!.id);
                          closeModal();
                          notify("Kilometerstand gelöscht.");
                        } catch {
                          notify("Löschen fehlgeschlagen.");
                        }
                    }}
                  >
                    <Trash2 size={17} /> Kilometerstand löschen
                  </button>
                )}
              </>
            )
          )}
        </Sheet>
      )}
      <footer className="desktop-footer">
        <span>Tankmo · Für die Freude am Überblick.</span>
        <span>
          Privat & offline <ArrowUpRight size={12} />
        </span>
      </footer>
    </>
  );
}
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Tankmo UI error", error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <main className="startup">
        <h1>Das hat nicht geklappt.</h1>
        <p>
          Die Ansicht konnte nicht geladen werden. Deine gespeicherten Daten
          bleiben erhalten.
        </p>
        <button className="primary" onClick={() => location.reload()}>
          Tankmo neu öffnen
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
