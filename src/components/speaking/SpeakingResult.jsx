import { useState } from "react";
import {
  AudioLines,
  ChevronDown,
  CircleAlert,
  Clock3,
  Gauge,
  Info,
  MessageSquareQuote,
  CirclePause,
  Repeat,
  Target,
} from "lucide-react";
import ScoreRing, { ScoreBar } from "./ScoreRing";

const STATUS_LABELS = {
  correct: "Clear",
  close: "Close: one sound differed",
  unclear: "Unclear: heard as a different word",
  missed: "Missed: not heard",
  not_reached: "Not reached",
};

function paceLabel(wpm) {
  if (wpm === null || wpm === undefined) return "Not enough speech to measure";
  if (wpm < 90) return "A little slow. Aim for 90–170 WPM";
  if (wpm > 170) return "A little fast. Slow down slightly";
  return "Comfortable pace (90–170 WPM)";
}

function Metric({ icon: Icon, label, value, hint }) {
  return (
    <div className="metric">
      <Icon size={17} aria-hidden="true" />
      <div>
        <p className="metric__value">{value}</p>
        <p className="metric__label">{label}</p>
        {hint && <p className="metric__hint">{hint}</p>}
      </div>
    </div>
  );
}

function WordView({ words }) {
  return (
    <div className="word-view">
      <p className="word-view__text">
        {words.map((w, i) => {
          const title =
            STATUS_LABELS[w.status] +
            (w.heard && w.status !== "correct" ? ` (heard "${w.heard}")` : "") +
            (w.hint ? `. ${w.hint}` : "");
          // The trailing space lets the browser wrap between words.
          return (
            <span key={i}>
              <span className={`w w--${w.status}`} title={title}>
                {w.text}
              </span>{" "}
            </span>
          );
        })}
      </p>
      <ul className="word-legend" aria-label="Legend">
        <li><span className="w w--correct">Clear</span></li>
        <li><span className="w w--close">Close</span></li>
        <li><span className="w w--unclear">Unclear</span></li>
        <li><span className="w w--missed">Missed</span></li>
        <li><span className="w w--not_reached">Not reached</span></li>
      </ul>
    </div>
  );
}

export default function SpeakingResult({ attempt }) {
  const [showMethod, setShowMethod] = useState(false);
  const { scores = {}, metrics = {}, words = [], practiceWords = [], pauses = [], fluencyPenalties = {} } = attempt;

  return (
    <div className="speaking-result">
      <section className="card result-scores">
        <ScoreRing score={scores.overall} label="Overall" />
        <div className="result-scores__bars">
          <ScoreBar
            label="Pronunciation (clarity)"
            score={scores.pronunciation}
            description={`${metrics.correct} clear, ${metrics.close} close, ${metrics.unclear} unclear of ${metrics.wordsRead} words read`}
          />
          <ScoreBar
            label="Fluency"
            score={scores.fluency}
            description={`${metrics.hesitations} hesitation${metrics.hesitations === 1 ? "" : "s"}, ${metrics.longPauses} long pause${metrics.longPauses === 1 ? "" : "s"}, ${metrics.repetitions} repeat${metrics.repetitions === 1 ? "" : "s"}`}
          />
          <ScoreBar
            label="Completeness"
            score={scores.completeness}
            description={`${metrics.wordsRead} of ${metrics.passageWords} passage words read`}
          />
        </div>
      </section>

      <section className="metric-grid">
        <Metric icon={Gauge} label="Words per minute" value={metrics.wordsPerMinute ?? "–"} hint={paceLabel(metrics.wordsPerMinute)} />
        <Metric icon={Clock3} label="Speaking time" value={`${metrics.speakingSec ?? 0}s`} hint={`Recording: ${metrics.audioSec ?? 0}s`} />
        <Metric
          icon={CirclePause}
          label="Pauses"
          value={metrics.hesitations + metrics.longPauses}
          hint={metrics.longestPauseSec ? `Longest: ${metrics.longestPauseSec}s` : "No hesitations detected"}
        />
        <Metric
          icon={Repeat}
          label="Repeats & fillers"
          value={metrics.repetitions + metrics.fillers}
          hint={`${metrics.repetitions} repeated, ${metrics.fillers} filler${metrics.fillers === 1 ? "" : "s"}`}
        />
      </section>

      <section className="card result-panel">
        <h3 className="result-panel__title">
          <Target size={17} aria-hidden="true" /> Word by word
        </h3>
        <p className="result-panel__sub">Hover or tap a highlighted word to see what the recognizer heard.</p>
        <WordView words={words} />
      </section>

      <div className="result-columns">
        <section className="card result-panel">
          <h3 className="result-panel__title">
            <CircleAlert size={17} aria-hidden="true" /> Words to practise
          </h3>
          {practiceWords.length === 0 ? (
            <p className="result-panel__empty">Every word you read was recognised clearly. Great job!</p>
          ) : (
            <ul className="practice-words">
              {practiceWords.map((p) => (
                <li key={`${p.word}-${p.status}`} className="practice-word">
                  <div className="practice-word__top">
                    <strong>{p.word}</strong>
                    <span className={`w w--${p.status}`}>{p.status === "missed" ? "missed" : p.status}</span>
                  </div>
                  {p.heard && <p className="practice-word__heard">Heard as "{p.heard}"</p>}
                  {p.hint && <p className="practice-word__hint">{p.hint}</p>}
                  {!p.heard && <p className="practice-word__hint">This word wasn't heard. Say it clearly without skipping it.</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card result-panel">
          <h3 className="result-panel__title">
            <CirclePause size={17} aria-hidden="true" /> Pauses
          </h3>
          {pauses.length === 0 ? (
            <p className="result-panel__empty">No hesitations or long pauses. Your reading flowed well.</p>
          ) : (
            <ul className="pause-list">
              {pauses.map((p, i) => (
                <li key={i}>
                  <span className={`pause-tag pause-tag--${p.type}`}>{p.type === "long" ? "Long pause" : "Hesitation"}</span>
                  <span>
                    {p.durationSec}s between "{p.afterWord}" and "{p.beforeWord}"
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card result-panel">
        <h3 className="result-panel__title">
          <MessageSquareQuote size={17} aria-hidden="true" /> What the speech recognizer heard
        </h3>
        <p className="transcript">“{attempt.transcript}”</p>
        {(attempt.extraWords?.length > 0 || attempt.fillerWords?.length > 0) && (
          <p className="result-panel__sub">
            {attempt.extraWords?.length > 0 && <>Extra words: {attempt.extraWords.join(", ")}. </>}
            {attempt.fillerWords?.length > 0 && <>Fillers: {attempt.fillerWords.join(", ")}.</>}
          </p>
        )}
      </section>

      <section className="method card">
        <button type="button" className="method__toggle" onClick={() => setShowMethod((v) => !v)} aria-expanded={showMethod}>
          <Info size={16} aria-hidden="true" /> How these scores are calculated
          <ChevronDown size={16} className={showMethod ? "is-open" : ""} aria-hidden="true" />
        </button>
        {showMethod && (
          <div className="method__body">
            <p>
              <AudioLines size={15} aria-hidden="true" /> Your recording was transcribed on the Speakify server by{" "}
              <strong>{attempt.engine?.name || "Whisper"}</strong> ({attempt.engine?.model}). Each passage word was then
              matched against what was heard.
            </p>
            <ul>
              <li>
                <strong>Pronunciation (clarity)</strong>: the % of words you read that the recognizer understood as the
                intended word. "Close" words (one sound different) count half. This measures how understandable your
                speech is. It is <em>not</em> a phoneme-by-phoneme acoustic score.
              </li>
              <li>
                <strong>Fluency</strong>: 100 minus penalties. Pace outside 90–170 WPM: −{fluencyPenalties.pace ?? 0};
                hesitations (gaps ≥ 0.6s mid-phrase): −{fluencyPenalties.hesitations ?? 0}; long pauses (≥ 1.5s): −
                {fluencyPenalties.longPauses ?? 0}; repeated words: −{fluencyPenalties.repetitions ?? 0}; fillers: −
                {fluencyPenalties.fillers ?? 0}.
              </li>
              <li>
                <strong>Completeness</strong>: the % of passage words you read.
              </li>
              <li>
                <strong>Overall</strong> = (55% pronunciation + 45% fluency) × completeness.
              </li>
            </ul>
            <p className="method__note">
              Limitation: speech recognizers sometimes auto-correct a slightly mispronounced word, so small mistakes can
              be missed. Words flagged as unclear or close were genuinely heard differently.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
