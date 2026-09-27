import { Lock } from "lucide-react";

// Achievements unlock only from real data (see utils/learning.js).
export default function Achievements({ items, compact = false }) {
  return (
    <ul className={`achievements ${compact ? "achievements--compact" : ""}`}>
      {items.map((a) => (
        <li key={a.id} className={`achievement ${a.unlocked ? "is-unlocked" : "is-locked"}`}>
          <span className="achievement__badge" aria-hidden="true">
            {a.unlocked ? a.emoji : <Lock size={18} />}
          </span>
          <div className="achievement__text">
            <p className="achievement__title">
              {a.title}
              <span className="sr-only">{a.unlocked ? " (unlocked)" : " (locked)"}</span>
            </p>
            <p className="achievement__desc">{a.description}</p>
            {!a.unlocked && (
              <div className="achievement__progress">
                <span className="achievement__bar" aria-hidden="true">
                  <span style={{ width: `${Math.round(a.progress * 100)}%` }} />
                </span>
                <span className="achievement__count">
                  {a.isScore ? `Best ${a.value || 0}` : `${a.value || 0}/${a.target}`}
                </span>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
