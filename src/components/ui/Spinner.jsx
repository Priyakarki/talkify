import { LoaderCircle } from "lucide-react";

export function Spinner({ size = 22, label = "Loading" }) {
  return (
    <span className="spinner" role="status" aria-label={label}>
      <LoaderCircle size={size} className="spin" aria-hidden="true" />
    </span>
  );
}

export function PageLoader({ label = "Loading…" }) {
  return (
    <div className="page-loader">
      <Spinner size={26} label={label} />
      <p>{label}</p>
    </div>
  );
}

export function Skeleton({ width = "100%", height = 14, radius = 8, className = "" }) {
  return <span className={`skeleton ${className}`} style={{ width, height, borderRadius: radius }} />;
}
