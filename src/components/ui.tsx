import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight, Fuel, X } from "lucide-react";
import { type FuelEntry, type FuelStation, fuelNames } from "../models/types";
import { dateLabel, euro, number, price, timeLabel } from "../utils/format";
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="metric">
      <div className="metric-top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      {detail && <div className="muted small">{detail}</div>}
    </Card>
  );
}
export function Empty({
  title = "Hier ist noch Platz für deine erste Fahrt.",
  text,
  action,
}: {
  title?: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Fuel size={30} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function FuelCard({
  entry,
  stations,
  onClick,
}: {
  entry: FuelEntry;
  stations: FuelStation[];
  onClick: () => void;
}) {
  const station = stations.find((s) => s.id === entry.stationId);
  return (
    <button className="fuel-card" onClick={onClick}>
      <span className="fuel-symbol">
        <Fuel size={23} />
      </span>
      <span className="fuel-content">
        <span className="row">
          <strong>{fuelNames[entry.fuelType]}</strong>
          <strong>{euro(entry.totalCost)}</strong>
        </span>
        <span className="row muted small">
          <span>
            {dateLabel(entry.date, true)} · {timeLabel(entry.date)}
          </span>
          <span>{number(entry.liters)} L</span>
        </span>
        <span className="row small">
          <span className="muted">
            {station?.name ?? "Ohne Tankstelle"}
            {entry.odometer !== undefined
              ? ` · ${number(entry.odometer, 0)} km`
              : ""}
          </span>
          <span className="price">
            {number(price(entry), 3)} €/L <ArrowUpRight size={12} />
          </span>
        </span>
      </span>
    </button>
  );
}
export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRef.current();
      }}
    >
      <div className="sheet-inner">
        <div className="sheet-handle" />
        <header className="sheet-header">
          <h2 id="sheet-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Schließen"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
