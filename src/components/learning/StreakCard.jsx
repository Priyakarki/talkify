import { Flame } from "lucide-react";

// Real learning streak (days with reading or speaking activity) + last 7 days.
export default function StreakCard({ streak, week }) {
  const current = streak?.current || 0;
  return (
    <div className="streak-card card">
      <div className="streak-card__top">
        <span className={`streak-card__flame ${current > 0 ? "is-lit" : ""}`} aria-hidden="true">
          <Flame size={26} />
        </span>
        <div>
          <p className="card-kicker">Learning streak</p>
          <p className="streak-card__value">
            {current} {current === 1 ? "day" : "days"}
          </p>
        </div>
      </div>
      <ul className="week-strip" aria-label="Activity in the last 7 days">
        {week.map((d) => (
          <li key={d.key} className={`${d.active ? "is-active" : ""} ${d.isToday ? "is-today" : ""}`}>
            <span className="week-strip__dot" aria-hidden="true">{d.active ? "✓" : ""}</span>
            <span className="week-strip__label">
              {d.label}
              <span className="sr-only">{d.active ? ": practised" : ": no practice"}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="streak-card__sub">
        {streak?.activeToday
          ? "You practised today. Keep it going!"
          : current > 0
            ? "Practise today to keep your streak alive."
            : "Read or speak today to start a streak."}
      </p>
    </div>
  );
}
