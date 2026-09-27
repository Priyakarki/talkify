import { useEffect, useState } from "react";
import { scoreTone } from "../../utils/learning";

export { scoreTone };

function usePrefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Counts from 0 to the real score once, for the "reveal" effect.
function useCountUp(target, enabled) {
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled || target === null || target === undefined) {
      setValue(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);
  return value;
}

// Circular score (0–100). The value always comes from the backend analysis.
export default function ScoreRing({ score, size = 132, label = "Overall", stroke = 10, animate = true }) {
  const reduced = usePrefersReducedMotion();
  const shouldAnimate = animate && !reduced;
  const shown = useCountUp(score, shouldAnimate);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, shown ?? 0));
  const offset = circumference * (1 - value / 100);

  return (
    <div
      className={`score-ring score-ring--${scoreTone(score)}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label} score: ${score ?? "not available"} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="score-ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className="score-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-ring__text" aria-hidden="true">
        <span className="score-ring__number">{score === null || score === undefined ? "–" : shown}</span>
        <span className="score-ring__label">{label}</span>
      </div>
    </div>
  );
}

export function ScoreBar({ label, score, description }) {
  return (
    <div className={`score-bar score-bar--${scoreTone(score)}`}>
      <div className="score-bar__top">
        <span className="score-bar__label">{label}</span>
        <span className="score-bar__value">
          {score}
          <small>/100</small>
        </span>
      </div>
      <div className="score-bar__track" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <span style={{ width: `${score}%` }} />
      </div>
      {description && <p className="score-bar__desc">{description}</p>}
    </div>
  );
}
