import { Target } from "lucide-react";
import { DAILY_SPEAKING_GOAL } from "../../utils/learning";

// Today's real speaking sessions vs the daily goal setting.
export default function DailyGoal({ done }) {
  const goal = DAILY_SPEAKING_GOAL;
  const pct = Math.min(1, done / goal);
  const r = 34;
  const c = 2 * Math.PI * r;
  const complete = done >= goal;
  return (
    <div className="goal-card card">
      <div className="goal-card__ring" role="img" aria-label={`Daily goal: ${Math.min(done, goal)} of ${goal} speaking sessions today`}>
        <svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true">
          <circle cx="42" cy="42" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="9" />
          <circle
            cx="42"
            cy="42"
            r={r}
            fill="none"
            stroke={complete ? "var(--mint)" : "var(--brand)"}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            transform="rotate(-90 42 42)"
            className="goal-card__arc"
          />
        </svg>
        <span className="goal-card__count">
          {Math.min(done, goal)}
          <small>/{goal}</small>
        </span>
      </div>
      <div>
        <p className="card-kicker">
          <Target size={14} aria-hidden="true" /> Daily goal
        </p>
        <p className="goal-card__title">{complete ? "Goal reached! 🎉" : `${goal - done} more to go`}</p>
        <p className="goal-card__sub">
          {complete ? "Amazing. Come back tomorrow to keep your streak." : `Complete ${goal} speaking sessions today.`}
        </p>
      </div>
    </div>
  );
}
