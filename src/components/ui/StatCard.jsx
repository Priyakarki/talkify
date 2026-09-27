import { Skeleton } from "./Spinner";

// tone: brand | success | warning | neutral
export default function StatCard({ icon: Icon, label, value, hint, tone = "brand", loading = false }) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${tone}`}>
        {Icon && <Icon size={19} aria-hidden="true" />}
      </div>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        {loading ? (
          <Skeleton width={56} height={28} />
        ) : (
          <p className="stat-card__value">{value}</p>
        )}
        {hint && !loading && <p className="stat-card__hint">{hint}</p>}
      </div>
    </div>
  );
}
