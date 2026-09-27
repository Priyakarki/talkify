import { useMemo, useState } from "react";
import { formatDate } from "../../utils/format";

/*
 * Single-series line chart of real overall scores (oldest → newest).
 * One series, so the title names it (no legend box). Hover or focus a point
 * for its value. A table view is provided for screen readers.
 */
export default function ScoreTrendChart({ points }) {
  const [active, setActive] = useState(null);
  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 28, left: 34 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const coords = useMemo(
    () =>
      points.map((p, i) => ({
        ...p,
        x: pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
        y: pad.top + innerH * (1 - p.score / 100),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points]
  );

  if (points.length === 0) return null;
  const line = coords.map((c, i) => `${i ? "L" : "M"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${pad.top + innerH} L${coords[0].x.toFixed(1)},${pad.top + innerH} Z`;
  const tip = active !== null ? coords[active] : null;

  return (
    <figure className="trend">
      <div className="trend__plot" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Overall score for each story reading, oldest to newest">
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--brand)" stopOpacity="0.18" />
              <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map((v) => {
            const y = pad.top + innerH * (1 - v / 100);
            return (
              <g key={v}>
                <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="trend__grid" />
                <text x={pad.left - 8} y={y + 4} className="trend__axis" textAnchor="end">
                  {v}
                </text>
              </g>
            );
          })}
          <path d={area} fill="url(#trend-fill)" />
          <path d={line} className="trend__line" />
          {tip && <line x1={tip.x} x2={tip.x} y1={pad.top} y2={pad.top + innerH} className="trend__cross" />}
          {coords.map((c, i) => (
            <g key={c.id}>
              <circle cx={c.x} cy={c.y} r={active === i ? 6.5 : 5} className="trend__dot" />
              <circle
                cx={c.x}
                cy={c.y}
                r="16"
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${c.title}, ${formatDate(c.date)}: ${c.score}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          ))}
          {coords.length > 1 && (
            <>
              <text x={coords[0].x} y={height - 6} className="trend__axis" textAnchor="start">
                {formatDate(coords[0].date, { year: undefined })}
              </text>
              <text x={coords[coords.length - 1].x} y={height - 6} className="trend__axis" textAnchor="end">
                {formatDate(coords[coords.length - 1].date, { year: undefined })}
              </text>
            </>
          )}
        </svg>
        {tip && (
          <div className="trend__tip" style={{ left: `${(tip.x / width) * 100}%`, top: `${(tip.y / height) * 100}%` }}>
            <strong>{tip.score}</strong>
            <span>{tip.title}</span>
            <span>{formatDate(tip.date)}</span>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>Overall score per story reading</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Story</th>
            <th>Overall</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.id}>
              <td>{formatDate(p.date)}</td>
              <td>{p.title}</td>
              <td>{p.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
