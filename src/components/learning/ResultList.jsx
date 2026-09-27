import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { formatRelative } from "../../utils/format";
import { scoreTone } from "../../utils/learning";

// Recent AI story analyses (GET /api/ai/speaking-analyses).
export default function ResultList({ analyses, limit = 5 }) {
  return (
    <ul className="result-list">
      {analyses.slice(0, limit).map((a) => (
        <li key={a._id}>
          <Link to={`/results/${a._id}`} className="result-row">
            <span className={`result-row__score result-row__score--${scoreTone(a.overallScore)}`}>{a.overallScore}</span>
            <span className="result-row__main">
              <span className="result-row__title">{a.storyTitle || "Custom text"}</span>
              <span className="result-row__meta">
                {a.level} · {a.speed?.wpm ? `${a.speed.wpm} WPM · ` : ""}
                {formatRelative(a.createdAt)}
              </span>
            </span>
            <span className="result-row__chips" aria-hidden="true">
              <span title="Pronunciation">P {a.pronunciationScore}</span>
              <span title="Fluency">F {a.fluencyScore}</span>
              <span title="Reading accuracy">A {a.readingAccuracyScore}</span>
            </span>
            <ChevronRight size={18} aria-hidden="true" className="result-row__chev" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
