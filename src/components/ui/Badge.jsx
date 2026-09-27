import { CircleCheck, Clock3 } from "lucide-react";
import { getDifficulty } from "../../utils/difficulty";

export function Badge({ tone = "neutral", children, icon: Icon, className = "" }) {
  return (
    <span className={`badge badge--${tone} ${className}`}>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function DifficultyBadge({ difficulty, showLevel = false }) {
  const info = getDifficulty(difficulty);
  return (
    <Badge tone={info.value}>
      <span className="badge__dot" aria-hidden="true" />
      {info.label}
      {showLevel && <span className="badge__muted">· {info.level}</span>}
    </Badge>
  );
}

export function StatusBadge({ status }) {
  if (status === "completed") {
    return (
      <Badge tone="success" icon={CircleCheck}>
        Completed
      </Badge>
    );
  }
  if (status === "in-progress") {
    return (
      <Badge tone="brand" icon={Clock3}>
        In progress
      </Badge>
    );
  }
  return null;
}
