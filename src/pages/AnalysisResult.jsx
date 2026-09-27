import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  CircleCheck,
  Gauge,
  Info,
  LayoutDashboard,
  MessageSquareQuote,
  Mic,
  CirclePause,
  RotateCcw,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  Waves,
} from "lucide-react";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/Spinner";
import ScoreRing from "../components/speaking/ScoreRing";
import Mascot from "../components/illustrations/Mascot";
import PracticeWordCard from "../components/learning/PracticeWordCard";
import PracticeWordModal from "../components/learning/PracticeWordModal";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { practiceItemsFrom } from "../hooks/usePracticeWords";
import useToast from "../hooks/useToast";
import { getSpeakingAnalysis } from "../services/aiService";
import { completeReading, getProgress, getProgressStoryId, startReading } from "../services/progressService";
import { getErrorMessage, isNotFound } from "../utils/errors";
import { formatDateTime } from "../utils/format";
import { levelTone, scoreMessage, scoreTone } from "../utils/learning";

const WORD_LABEL = {
  correct: "Clear",
  accent: "Accent variation (not a mistake)",
  pronunciation: "Pronunciation to practise",
  wrong: "Different word read",
  skipped: "Skipped",
  not_read: "Not read",
};

function MetricCard({ icon: Icon, tone, title, score, value, unit, badge, children }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top">
        <span className="metric-card__icon" aria-hidden="true">
          <Icon size={20} />
        </span>
        <h3>{title}</h3>
        {badge && <span className="metric-card__badge">{badge}</span>}
      </div>
      <p className="metric-card__score">
        {value ?? score}
        <small>{unit ?? "/100"}</small>
      </p>
      {typeof score === "number" && (
        <div className={`meter meter--${scoreTone(score)}`} role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`${title} score`}>
          <span style={{ width: `${score}%` }} />
        </div>
      )}
      <div className="metric-card__body">{children}</div>
    </article>
  );
}

function normalize(payload) {
  // POST response: { analysisId, story, analysis }; GET /:id adds createdAt
  return {
    analysisId: payload.analysisId || null,
    story: payload.story || null,
    createdAt: payload.createdAt || new Date().toISOString(),
    analysis: payload.analysis,
  };
}

export default function AnalysisResult() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const passed = location.state?.result;

  const [data, setData] = useState(() =>
    passed && (id === "unsaved" || passed.analysisId === id) ? normalize(passed) : null
  );
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const [practising, setPractising] = useState(null);
  const [showMethod, setShowMethod] = useState(false);
  const [progress, setProgress] = useState({ status: undefined, recordId: null, busy: false });

  useDocumentTitle(data ? `Result: ${data.story?.title || "Speaking"}` : "Speaking result");

  const load = useCallback(async () => {
    if (id === "unsaved") {
      setError(new Error("This result wasn't saved, so it can't be reopened. Please try the story again."));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(normalize(await getSpeakingAnalysis(id)));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!data) load();
  }, [data, load]);

  // Reading status of this story (to offer "Mark story as completed").
  const storyId = data?.story?._id;
  useEffect(() => {
    if (!storyId) return;
    getProgress()
      .then((records) => {
        const mine = records.filter((r) => getProgressStoryId(r) === storyId);
        const completed = mine.find((r) => r.status === "completed");
        const open = mine.find((r) => r.status === "in-progress");
        setProgress({ status: completed ? "completed" : open ? "in-progress" : null, recordId: (completed || open)?._id || null, busy: false });
      })
      .catch(() => setProgress((p) => ({ ...p, status: undefined })));
  }, [storyId]);

  const markCompleted = async () => {
    setProgress((p) => ({ ...p, busy: true }));
    try {
      let recordId = progress.recordId;
      if (!recordId) recordId = (await startReading(storyId))._id; // existing API: returns the one record per story
      const updated = await completeReading(recordId);
      setProgress({ status: updated.status, recordId: updated._id, busy: false });
      toast.success("Story completed! 📖", "It's been added to your progress.");
    } catch (err) {
      setProgress((p) => ({ ...p, busy: false }));
      toast.error("Couldn't update progress", getErrorMessage(err));
    }
  };

  const a = data?.analysis;
  const message = useMemo(() => (a ? scoreMessage(a.overallScore) : null), [a]);

  if (loading) return <PageLoader label="Loading your results…" />;
  if (error || !a) {
    return (
      <div className="page">
        <ErrorState
          title={isNotFound(error) ? "Result not found" : "Couldn't open this result"}
          message={isNotFound(error) ? "It may belong to another account or the link is wrong." : getErrorMessage(error)}
          onRetry={isNotFound(error) || id === "unsaved" ? undefined : load}
          action={
            <Button to="/dashboard" variant="secondary" size="sm" icon={LayoutDashboard}>
              Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const s = a.scores || {};
  const mistakes = a.pronunciation?.mistakes || [];
  // The same word can be mispronounced several times in one story: show it once with a count.
  const groupedMistakes = Object.values(
    mistakes.reduce((acc, m) => {
      const key = `${m.word.toLowerCase()}|${(m.userPronunciation || "").toLowerCase()}`;
      if (!acc[key]) acc[key] = { ...m, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {})
  );
  const accent = a.pronunciation?.accentVariations || [];
  const ra = a.readingAccuracy || {};
  const practice = practiceItemsFrom(a); // practiceWords + readingAccuracy.wrongWords
  const tryAgainTo = storyId ? `/stories/${storyId}/speak` : "/speaking";

  return (
    <div className="page result-page">
      <Link to={storyId ? `/stories/${storyId}` : "/dashboard"} className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> {storyId ? "Back to story" : "Dashboard"}
      </Link>

      {/* ---------- Hero ---------- */}
      <section className="result-hero">
        <div className="result-hero__main">
          <Mascot size={96} mood={message.mood} className="result-hero__mascot" />
          <div>
            <p className="result-hero__story">
              {data.story?.title || "Custom text"} · {formatDateTime(data.createdAt)}
            </p>
            <h1 className="result-hero__title">{message.title}</h1>
            <p className="result-hero__sub">{message.subtitle}</p>
            <span className={`level-badge level-badge--${levelTone(a.level)}`}>
              <Sparkles size={14} aria-hidden="true" /> {a.level}
            </span>
          </div>
        </div>
        <div className="result-hero__ring">
          <ScoreRing score={a.overallScore} size={172} stroke={14} label="Overall" />
        </div>
        <div className="result-hero__actions">
          <Button to={tryAgainTo} icon={RotateCcw}>
            Try again
          </Button>
          {practice.length > 0 && (
            <Button variant="secondary" icon={Target} onClick={() => document.getElementById("practice")?.scrollIntoView({ behavior: "smooth" })}>
              Practice words
            </Button>
          )}
          {storyId && (
            <Button to={`/stories/${storyId}`} variant="secondary" icon={BookOpen}>
              Back to story
            </Button>
          )}
          <Button to="/dashboard" variant="ghost" icon={LayoutDashboard}>
            Dashboard
          </Button>
        </div>
        <p className="result-hero__note">{a.levelNote}</p>
      </section>

      {storyId && progress.status !== undefined && progress.status !== "completed" && (
        <div className="complete-banner">
          <CircleCheck size={20} aria-hidden="true" />
          <p>Finished reading this story? Mark it as completed to track your progress.</p>
          <Button size="sm" variant="secondary" onClick={markCompleted} loading={progress.busy}>
            Mark story as completed
          </Button>
        </div>
      )}

      {/* ---------- Scores ---------- */}
      <section className="metric-grid-5" aria-label="Score breakdown">
        <MetricCard icon={Mic} tone="brand" title="Pronunciation" score={s.pronunciationScore}>
          <p>{a.pronunciation?.explanation}</p>
        </MetricCard>
        <MetricCard icon={Waves} tone="sky" title="Fluency" score={s.fluencyScore}>
          <p>{a.fluency?.feedback}</p>
        </MetricCard>
        <MetricCard icon={BookOpen} tone="mint" title="Reading accuracy" score={s.readingAccuracyScore}>
          <p>
            {ra.wordsRead} of {ra.totalWords} words read
            {ra.skippedWords?.length ? `, ${ra.skippedWords.length} skipped` : ""}
            {ra.wrongWords?.length ? `, ${ra.wrongWords.length} changed` : ""}.
          </p>
        </MetricCard>
        <MetricCard icon={Gauge} tone="sun" title="Speaking speed" score={s.speedScore} value={a.speed?.wpm ?? "–"} unit=" WPM" badge={a.speed?.classification}>
          <p>
            {a.speed?.spokenWords} words in {a.speed?.durationSeconds}s · score {s.speedScore}/100
          </p>
        </MetricCard>
        <MetricCard icon={CirclePause} tone="pink" title="Pauses" score={s.pauseScore}>
          <p>
            {a.pauses?.totalPauses} pauses, {a.pauses?.unnecessaryPauses} unnecessary · longest {a.pauses?.longestPauseSeconds}s
          </p>
        </MetricCard>
      </section>

      
      {/* ---------- Word by word ---------- */}
      {a.words?.length > 0 && (
        <section className="card result-section">
          <h2 className="result-section__title">
            <BookOpen size={19} aria-hidden="true" /> How you read it
          </h2>
          <p className="result-section__sub">Tap or hover a highlighted word to see what Speakify heard.</p>
          <p className="read-text">
            {a.words.map((w) => (
              <span key={w.position}>
                <span
                  className={`rw rw--${w.status} ${w.severity ? `rw--${w.severity}` : ""}`}
                  title={`${WORD_LABEL[w.status] || w.status}${w.heard && w.status !== "correct" ? `: heard "${w.heard}"` : ""}`}
                  tabIndex={w.status === "correct" ? undefined : 0}
                >
                  {w.text}
                </span>{" "}
              </span>
            ))}
          </p>
          <ul className="rw-legend" aria-label="Colour legend">
            <li><span className="rw rw--correct">Clear</span></li>
            <li><span className="rw rw--pronunciation">To practise</span></li>
            <li><span className="rw rw--wrong">Different word</span></li>
            <li><span className="rw rw--skipped">Skipped</span></li>
            <li><span className="rw rw--accent">Accent (fine!)</span></li>
            <li><span className="rw rw--not_read">Not read</span></li>
          </ul>
        </section>
      )}

      {/* ---------- Wrong words ---------- */}
      <div className="result-columns-2">
        <section className="card result-section">
          <h2 className="result-section__title">
            <Target size={19} aria-hidden="true" /> Words to fix
          </h2>
          {mistakes.length === 0 ? (
            <div className="result-empty">
              <CircleCheck size={22} aria-hidden="true" />
              <p>No pronunciation problems were detected. Every word you read was recognised clearly!</p>
            </div>
          ) : (
            <ul className="fix-list">
              {groupedMistakes.map((m) => (
                <li key={`${m.word}-${m.position}`} className={`fix fix--${m.severity}`}>
                  <div className="fix__head">
                    <span className="fix__word">
                      {m.word}
                      {m.count > 1 && (
                        <span className="fix__count" title={`Heard this way ${m.count} times`}>
                          ×{m.count}
                        </span>
                      )}
                    </span>
                    <span className={`sev sev--${m.severity}`}>{m.severity}</span>
                  </div>
                  <div className="fix__compare">
                    <span className="fix__said">
                      <small>You said</small>“{m.userPronunciation}”
                    </span>
                    <span className="fix__arrow" aria-hidden="true">→</span>
                    <span className="fix__right">
                      <small>Say it</small>
                      {m.correctPronunciation || m.word}
                      {m.ipa && <em lang="en-fonipa"> {m.ipa}</em>}
                    </span>
                  </div>
                  <p className="fix__why">{m.explanation}</p>
                  <p className="fix__conf">Confidence {Math.round(m.confidence * 100)}%</p>
                </li>
              ))}
            </ul>
          )}
          {accent.length > 0 && (
            <p className="accent-note">
              <ThumbsUp size={15} aria-hidden="true" /> Your accent is fine! {accent.length} word{accent.length === 1 ? "" : "s"} (
              {accent.map((x) => x.word).join(", ")}) had normal accent variation and didn't count as mistakes.
            </p>
          )}
        </section>

        <section className="card result-section">
          <h2 className="result-section__title">
            <BookOpen size={19} aria-hidden="true" /> Reading accuracy
          </h2>
          <p className="result-section__sub">{a.feedback?.readingAccuracyFeedback}</p>
          <div className="chip-groups">
            {ra.wrongWords?.length > 0 && (
              <div>
                <p className="chip-groups__label">Changed words</p>
                <div className="chips">
                  {ra.wrongWords.map((w) => (
                    <span key={w.position} className="chip chip--wrong">
                      <s>{w.expected}</s> → {w.heard}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {ra.skippedWords?.length > 0 && (
              <div>
                <p className="chip-groups__label">Skipped</p>
                <div className="chips">
                  {ra.skippedWords.map((w) => (
                    <span key={w.position} className="chip chip--skipped">{w.word}</span>
                  ))}
                </div>
              </div>
            )}
            {ra.addedWords?.length > 0 && (
              <div>
                <p className="chip-groups__label">Extra words</p>
                <div className="chips">
                  {ra.addedWords.map((w, i) => (
                    <span key={i} className="chip">+ {w.word}</span>
                  ))}
                </div>
              </div>
            )}
            {(ra.repeatedWords?.length > 0 || ra.falseStarts?.length > 0) && (
              <div>
                <p className="chip-groups__label">Repeats & restarts</p>
                <div className="chips">
                  {ra.repeatedWords?.map((w, i) => (
                    <span key={`r${i}`} className="chip">↻ {w.word}</span>
                  ))}
                  {ra.falseStarts?.map((w, i) => (
                    <span key={`f${i}`} className="chip">
                      {w.heard}… {w.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!ra.wrongWords?.length && !ra.skippedWords?.length && !ra.addedWords?.length && !ra.repeatedWords?.length && !ra.falseStarts?.length && (
              <div className="result-empty">
                <CircleCheck size={22} aria-hidden="true" />
                <p>No skipped, extra or changed words.</p>
              </div>
            )}
            {ra.notReadCount > 0 && (
              <p className="result-section__sub">{ra.notReadCount} words at the end weren't read yet.</p>
            )}
          </div>
        </section>
      </div>

      {/* ---------- Practice words ---------- */}
      <section className="result-section-plain" id="practice">
        <div className="section-block__head">
          <div>
            <h2 className="section-block__title">
              <Target size={20} aria-hidden="true" className="inline-icon" /> Practice words
            </h2>
            <p className="section-block__sub">Practise these, then read the story again.</p>
          </div>
          {practice.length > 0 && (
            <Button to="/practice-words" variant="ghost" size="sm">
              All practice words
            </Button>
          )}
        </div>
        {practice.length === 0 ? (
          <div className="card result-empty result-empty--card">
            <Sparkles size={22} aria-hidden="true" />
            <p>Nothing to practise from this reading. Try a harder story next!</p>
          </div>
        ) : (
          <div className="word-grid">
            {practice.map((p) => (
              <PracticeWordCard key={p.word} item={p} onPractise={setPractising} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Feedback ---------- */}
      <section className="feedback-grid">
        <div className="card feedback-card feedback-card--good">
          <h2>
            <ThumbsUp size={18} aria-hidden="true" /> What you did well
          </h2>
          <ul>
            {(a.feedback?.strengths || []).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card feedback-card feedback-card--grow">
          <h2>
            <TrendingUp size={18} aria-hidden="true" /> What to improve
          </h2>
          <ul>
            {(a.feedback?.topImprovements || []).map((t) => (
              <li key={t}>{t}</li>
            ))}
            {(a.feedback?.topFluencyProblems || []).slice(0, 2).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card feedback-card">
          <h2>
            <Gauge size={18} aria-hidden="true" /> Speed & pauses
          </h2>
          <p>{a.feedback?.speedFeedback}</p>
          <p>{a.feedback?.pauseFeedback}</p>
        </div>
        <div className="card feedback-card">
          <h2>
            <Sparkles size={18} aria-hidden="true" /> Practise next
          </h2>
          <ul>
            {(a.feedback?.practiceNext || []).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Details ---------- */}
      <section className="card result-section">
        <h2 className="result-section__title">
          <MessageSquareQuote size={19} aria-hidden="true" /> What Speakify heard
        </h2>
        <p className="transcript-box">“{a.transcript}”</p>
        <dl className="detail-stats">
          <div>
            <dt>Hesitations</dt>
            <dd>{a.fluency?.hesitations ?? 0}</dd>
          </div>
          <div>
            <dt>Repeated words</dt>
            <dd>{a.fluency?.repetitions ?? 0}</dd>
          </div>
          <div>
            <dt>Filler words</dt>
            <dd>{a.fluency?.fillers ?? 0}</dd>
          </div>
          <div>
            <dt>Avg. pause</dt>
            <dd>{a.pauses?.averagePauseSeconds ?? 0}s</dd>
          </div>
          <div>
            <dt>Speaking time</dt>
            <dd>{a.speed?.durationSeconds}s</dd>
          </div>
        </dl>
      </section>

      <section className="card method">
        <button type="button" className="method__toggle" onClick={() => setShowMethod((v) => !v)} aria-expanded={showMethod}>
          <Info size={16} aria-hidden="true" /> How Speakify calculates these scores
          <ChevronDown size={16} className={showMethod ? "is-open" : ""} aria-hidden="true" />
        </button>
        {showMethod && (
          <div className="method__body">
            <p>
              Overall = {Math.round((a.weights?.pronunciation || 0) * 100)}% pronunciation + {Math.round((a.weights?.fluency || 0) * 100)}% fluency +{" "}
              {Math.round((a.weights?.readingAccuracy || 0) * 100)}% reading accuracy + {Math.round((a.weights?.speed || 0) * 100)}% speed +{" "}
              {Math.round((a.weights?.pause || 0) * 100)}% pauses.
            </p>
            {a.analysisMethod && (
              <ul>
                <li>
                  <strong>Measured from your audio:</strong> {a.analysisMethod.measuredFromAudio?.join("; ")}.
                </li>
                <li>
                  <strong>Detected by speech recognition:</strong> {a.analysisMethod.detectedFromRecognition?.join("; ")}.
                </li>
                <li>
                  <strong>Worked out from the transcript:</strong> {a.analysisMethod.transcriptBasedInference?.join("; ")}.
                </li>
                <li>
                  <strong>Not measured:</strong> {a.analysisMethod.notAvailable?.join("; ")}.
                </li>
                <li>
                  <strong>Accents:</strong> {a.analysisMethod.accentPolicy}
                </li>
              </ul>
            )}
            {a.engine?.model && <p className="method__note">Speech engine: {a.engine.name} ({a.engine.model}).</p>}
          </div>
        )}
      </section>

      {practising && <PracticeWordModal item={practising} onClose={() => setPractising(null)} />}
    </div>
  );
}