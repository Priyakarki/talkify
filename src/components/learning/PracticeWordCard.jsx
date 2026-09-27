import { Mic } from "lucide-react";

const SEVERITY_LABEL = { minor: "Minor", moderate: "Needs practice", major: "Tricky word" };

// One practice word from the AI analysis (real data only; no audio playback,
// because the backend doesn't provide reference audio).
export default function PracticeWordCard({ item, onPractise, showSource = false }) {
  return (
    <article className={`word-card word-card--${item.severity || "minor"}`}>
      <div className="word-card__top">
        <h3 className="word-card__word">{item.word}</h3>
        {item.severity && <span className={`sev sev--${item.severity}`}>{SEVERITY_LABEL[item.severity] || item.severity}</span>}
      </div>
      {item.correctPronunciation && (
        <p className="word-card__say">
          <span className="word-card__label">Say it</span>
          <span className="word-card__respell">{item.correctPronunciation}</span>
        </p>
      )}
      {item.ipa && (
        <p className="word-card__ipa">
          <span className="word-card__label">IPA</span>
          <span lang="en-fonipa">{item.ipa}</span>
        </p>
      )}
      {item.heardAs && (
        <p className="word-card__heard">
          <span className="word-card__label">You said</span>
          <span>“{item.heardAs}”</span>
        </p>
      )}
      {item.practiceTip && <p className="word-card__tip">{item.practiceTip}</p>}
      {showSource && item.storyTitle && <p className="word-card__source">From “{item.storyTitle}”</p>}
      {onPractise && (
        <button type="button" className="btn btn--soft btn--sm word-card__btn" onClick={() => onPractise(item)}>
          <Mic size={15} aria-hidden="true" />
          <span>Practise this word</span>
        </button>
      )}
    </article>
  );
}
