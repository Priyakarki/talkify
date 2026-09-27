// Honest reading progress: the backend stores a status per story
// (not a percentage), so we show the three real stages.
const STAGES = [
  { key: null, label: "Not started" },
  { key: "in-progress", label: "Reading" },
  { key: "completed", label: "Completed" },
];

export default function ReadingTracker({ status = null, compact = false }) {
  const index = status === "completed" ? 2 : status === "in-progress" ? 1 : 0;
  return (
    <div className={`tracker tracker--${index} ${compact ? "tracker--compact" : ""}`} aria-label={`Reading progress: ${STAGES[index].label}`}>
      <div className="tracker__steps" aria-hidden="true">
        {STAGES.map((s, i) => (
          <span key={s.label} className={`tracker__step ${i <= index ? "is-done" : ""} ${i === index ? "is-current" : ""}`} />
        ))}
      </div>
      <span className="tracker__label">{STAGES[index].label}</span>
    </div>
  );
}
