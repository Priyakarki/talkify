import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Cpu,
  Gauge,
  History,
  Library,
  LoaderCircle,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Square,
  Target,
  Trophy,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
import ErrorState, { Alert } from "../components/ui/ErrorState";
import { DifficultyBadge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Spinner";
import SpeakingResult from "../components/speaking/SpeakingResult";
import { scoreTone } from "../components/speaking/ScoreRing";
import useWavRecorder from "../hooks/useWavRecorder";
import useToast from "../hooks/useToast";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getStories } from "../services/storyService";
import { analyzeSpeech, getAttempts, getPassages, getSpeakingStatus } from "../services/speakingService";
import { getErrorMessage } from "../utils/errors";
import { formatRelative } from "../utils/format";

const PERMISSION_INFO = {
  granted: { tone: "success", icon: Mic, text: "Microphone allowed" },
  denied: { tone: "danger", icon: MicOff, text: "Microphone blocked" },
  prompt: { tone: "neutral", icon: Mic, text: "Permission will be requested" },
  unknown: { tone: "neutral", icon: Mic, text: "Permission will be requested" },
  unsupported: { tone: "danger", icon: MicOff, text: "Recording not supported in this browser" },
};

function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function LevelMeter({ level }) {
  const bars = 24;
  return (
    <div className="level-meter" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const wave = 0.35 + 0.65 * Math.abs(Math.sin((i + 1) * 1.7));
        return (
          <span
            key={i}
            className={level * wave >= threshold * 0.6 ? "is-on" : ""}
            style={{ height: `${20 + wave * 80}%` }}
          />
        );
      })}
    </div>
  );
}

export default function Speaking() {
  useDocumentTitle("Speaking Practice");
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef(null);

  // ---- Server status (engine + limits) ----
  const [engineStatus, setEngineStatus] = useState(null);
  useEffect(() => {
    getSpeakingStatus()
      .then(setEngineStatus)
      .catch(() => setEngineStatus(null));
  }, []);
  const maxSeconds = engineStatus?.limits?.maxSeconds || 60;

  // ---- Stories ----
  const [stories, setStories] = useState([]);
  const [storiesState, setStoriesState] = useState({ loading: true, error: "" });

  const loadStories = useCallback(async () => {
    setStoriesState({ loading: true, error: "" });
    try {
      const data = await getStories({ page: 1, limit: 100 });
      setStories(data.stories || []);
      setStoriesState({ loading: false, error: "" });
    } catch (err) {
      setStoriesState({ loading: false, error: getErrorMessage(err, "We couldn't load stories.") });
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const storyId = searchParams.get("storyId") || stories[0]?._id || "";
  const passageIndex = Math.max(0, Number(searchParams.get("passage")) || 0);

  // ---- Passages for the chosen story ----
  const [passageData, setPassageData] = useState(null);
  const [passageState, setPassageState] = useState({ loading: false, error: "" });

  const loadPassages = useCallback(async () => {
    if (!storyId) return;
    setPassageState({ loading: true, error: "" });
    try {
      setPassageData(await getPassages(storyId));
      setPassageState({ loading: false, error: "" });
    } catch (err) {
      setPassageData(null);
      setPassageState({ loading: false, error: getErrorMessage(err, "We couldn't load this story.") });
    }
  }, [storyId]);

  useEffect(() => {
    loadPassages();
  }, [loadPassages]);

  const passages = passageData?.passages || [];
  const passage = passages[passageIndex] || passages[0] || null;

  // ---- History ----
  const [history, setHistory] = useState(null);
  const loadHistory = useCallback(async () => {
    try {
      const [all, forStory] = await Promise.all([
        getAttempts({ page: 1, limit: 1 }),
        storyId ? getAttempts({ storyId, page: 1, limit: 5 }) : Promise.resolve(null),
      ]);
      setHistory({ summary: all.summary, storyAttempts: forStory?.attempts || [] });
    } catch {
      setHistory(null);
    }
  }, [storyId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ---- Recording & analysis ----
  const recorder = useWavRecorder({ maxSeconds });
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStartedAt, setAnalyzeStartedAt] = useState(null);
  const [analyzeSeconds, setAnalyzeSeconds] = useState(0);
  const [analyzeError, setAnalyzeError] = useState("");
  const [attempt, setAttempt] = useState(null);

  // Changing story or passage starts fresh.
  const { reset: resetRecorder } = recorder;
  useEffect(() => {
    resetRecorder();
    setAttempt(null);
    setAnalyzeError("");
  }, [storyId, passageIndex, resetRecorder]);

  useEffect(() => {
    if (!analyzing) return undefined;
    const timer = setInterval(() => setAnalyzeSeconds(Math.round((Date.now() - analyzeStartedAt) / 1000)), 500);
    return () => clearInterval(timer);
  }, [analyzing, analyzeStartedAt]);

  const selectStory = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set("storyId", id);
    next.delete("passage");
    setSearchParams(next);
  };

  const selectPassage = (index) => {
    const next = new URLSearchParams(searchParams);
    if (storyId) next.set("storyId", storyId);
    if (index > 0) next.set("passage", String(index));
    else next.delete("passage");
    setSearchParams(next);
  };

  const handleAnalyze = async () => {
    if (!recorder.recording || !passage || analyzing) return;
    setAnalyzing(true);
    setAnalyzeStartedAt(Date.now());
    setAnalyzeSeconds(0);
    setAnalyzeError("");
    try {
      const result = await analyzeSpeech({ blob: recorder.recording.blob, storyId, passageIndex: passage.index });
      setAttempt(result);
      toast.success("Analysis ready", `Overall score: ${result.scores?.overall}/100`);
      loadHistory();
      getSpeakingStatus().then(setEngineStatus).catch(() => {});
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setAnalyzeError(getErrorMessage(err, "We couldn't analyse your recording."));
    } finally {
      setAnalyzing(false);
    }
  };

  const tryAgain = () => {
    recorder.reset();
    setAttempt(null);
    setAnalyzeError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const permission = PERMISSION_INFO[recorder.permission] || PERMISSION_INFO.unknown;
  const PermissionIcon = permission.icon;
  const summary = history?.summary;
  const modelNotReady = engineStatus && engineStatus.engine?.status !== "ready";
  const recordingDisabled = recorder.permission === "unsupported" || !passage || analyzing;

  const storyOptions = useMemo(() => stories.map((s) => ({ value: s._id, label: s.title })), [stories]);

  if (!storiesState.loading && storiesState.error) {
    return (
      <div className="page">
        <PageHeader eyebrow="Practice" title="Speaking Practice" />
        <ErrorState title="Couldn't load stories" message={storiesState.error} onRetry={loadStories} />
      </div>
    );
  }

  if (!storiesState.loading && stories.length === 0) {
    return (
      <div className="page">
        <PageHeader eyebrow="Practice" title="Speaking Practice" />
        <EmptyState
          icon={Library}
          title="No stories to practise yet"
          description="Speaking practice uses passages from your stories. Add a story first."
          action={<Button to="/admin/stories/new">Add a story</Button>}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Practice"
        title="Speaking Practice"
        subtitle="Warm up with short passages, or read a whole story aloud for full AI feedback."
      />

      {summary?.attempts > 0 && (
        <div className="stat-grid">
          <StatCard icon={AudioLines} label="Attempts" value={summary.attempts} />
          <StatCard icon={Sparkles} tone="brand" label="Average overall" value={summary.averageOverall ?? "–"} />
          <StatCard icon={Gauge} tone="warning" label="Average WPM" value={summary.averageWpm ?? "–"} />
          <StatCard icon={Trophy} tone="success" label="Best overall" value={summary.bestOverall ?? "–"} />
        </div>
      )}

      {storyId && (
        <Link to={`/stories/${storyId}/speak`} className="full-story-banner">
          <span className="full-story-banner__icon" aria-hidden="true">
            <Sparkles size={22} />
          </span>
          <span className="full-story-banner__text">
            <strong>Read the whole story for full AI feedback</strong>
            <small>Pronunciation with IPA, fluency, speed, pauses, reading accuracy and practice words.</small>
          </span>
          <span className="full-story-banner__cta">
            Start Speaking <ArrowRight size={16} aria-hidden="true" />
          </span>
        </Link>
      )}

      <h2 className="quick-practice-title">Quick passage practice</h2>

      <div className="speaking-layout">
        {/* 1. Passage */}
        <section className="card speaking-passage">
          <div className="speaking-step">
            <span className="speaking-step__num">1</span>
            <h2>Choose a passage</h2>
          </div>

          <label className="field__label" htmlFor="story-select">
            Story
          </label>
          {storiesState.loading ? (
            <Skeleton height={44} radius={12} />
          ) : (
            <div className="select-wrap">
              <BookOpen size={17} className="select-wrap__icon" aria-hidden="true" />
              <select
                id="story-select"
                className="input select"
                value={storyId}
                onChange={(e) => selectStory(e.target.value)}
                disabled={analyzing || recorder.status === "recording"}
              >
                {storyOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {passageState.error ? (
            <ErrorState compact message={passageState.error} onRetry={loadPassages} />
          ) : passageState.loading || !passage ? (
            <div className="speaking-passage__skeleton">
              <Skeleton width="40%" height={28} radius={999} />
              <Skeleton height={14} />
              <Skeleton height={14} />
              <Skeleton width="70%" height={14} />
            </div>
          ) : (
            <>
              <div className="passage-tabs" role="tablist" aria-label="Passages">
                {passages.map((p) => (
                  <button
                    key={p.index}
                    type="button"
                    role="tab"
                    aria-selected={p.index === passage.index}
                    className={`passage-tab ${p.index === passage.index ? "is-active" : ""}`}
                    onClick={() => selectPassage(p.index)}
                    disabled={analyzing || recorder.status === "recording"}
                  >
                    Passage {p.index + 1}
                  </button>
                ))}
              </div>

              <div className="passage-meta">
                <DifficultyBadge difficulty={passageData.story.difficulty} showLevel />
                <span>{passage.wordCount} words</span>
                <span>~{Math.max(5, Math.round((passage.wordCount / 110) * 60))}s aloud</span>
              </div>

              <blockquote className={`passage-text ${recorder.status === "recording" ? "is-live" : ""}`}>{passage.text}</blockquote>
              <p className="passage-tip">
                Tip: read the whole passage from the beginning, at a natural pace, in a quiet place.
              </p>
            </>
          )}
        </section>

        {/* 2. Recorder */}
        <section className="card recorder">
          <div className="speaking-step">
            <span className="speaking-step__num">2</span>
            <h2>Record yourself</h2>
          </div>

          <div className={`mic-status mic-status--${permission.tone}`}>
            <PermissionIcon size={15} aria-hidden="true" />
            {permission.text}
          </div>

          <div className={`recorder__stage recorder__stage--${recorder.status}`}>
            {recorder.status === "recording" ? (
              <>
                <div className="recorder__live">
                  <span className="recorder__dot" aria-hidden="true" /> Recording
                </div>
                <p className="recorder__timer" aria-live="off">
                  {formatTime(recorder.elapsed)} <small>/ {formatTime(maxSeconds)}</small>
                </p>
                <LevelMeter level={recorder.level} />
                <Button variant="danger" size="lg" icon={Square} onClick={recorder.stop} fullWidth>
                  Stop Recording
                </Button>
              </>
            ) : recorder.status === "recorded" && recorder.recording ? (
              <>
                <p className="recorder__timer">
                  {formatTime(recorder.recording.durationSec)} <small>recorded</small>
                </p>
                <audio className="recorder__audio" src={recorder.recording.url} controls preload="metadata" />
                <p className="recorder__note">
                  Listen back if you like. Nothing is uploaded until you press Analyze.
                </p>
                <Button size="lg" icon={Sparkles} onClick={handleAnalyze} loading={analyzing} fullWidth disabled={Boolean(attempt)}>
                  {analyzing ? "Analysing…" : attempt ? "Analysed" : "Analyze my speech"}
                </Button>
                <Button variant="ghost" icon={RotateCcw} onClick={tryAgain} disabled={analyzing} fullWidth>
                  Record again
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="mic-button"
                  onClick={recorder.start}
                  disabled={recordingDisabled || recorder.status === "requesting"}
                  aria-label="Start recording"
                >
                  {recorder.status === "requesting" ? <LoaderCircle size={34} className="spin" /> : <Mic size={34} />}
                </button>
                <Button
                  size="lg"
                  icon={Mic}
                  onClick={recorder.start}
                  loading={recorder.status === "requesting"}
                  disabled={recordingDisabled}
                  fullWidth
                >
                  {recorder.status === "requesting" ? "Waiting for permission…" : "Start Recording"}
                </Button>
                <p className="recorder__note">Up to {maxSeconds} seconds. Your browser will ask for microphone access.</p>
              </>
            )}
          </div>

          {recorder.error && <Alert>{recorder.error}</Alert>}
          {analyzeError && <Alert>{analyzeError}</Alert>}

          {analyzing && (
            <div className="analyzing" role="status">
              <LoaderCircle size={18} className="spin" aria-hidden="true" />
              <div>
                <p className="analyzing__title">Listening to your recording… {analyzeSeconds}s</p>
                <p className="analyzing__sub">
                  {modelNotReady
                    ? "First analysis: the free speech model is loading (one-time ~80 MB download). This can take a minute."
                    : "Usually takes a few seconds on a laptop CPU."}
                </p>
              </div>
            </div>
          )}

          <div className="engine-note">
            <Cpu size={15} aria-hidden="true" />
            <span>
              Analysed on the Speakify server with open-source Whisper. No paid APIs, and your audio isn't stored.
              {engineStatus?.engine?.status === "error" && <> Last model error: {engineStatus.engine.error}</>}
            </span>
          </div>
        </section>
      </div>

      {/* 3. Results */}
      <div ref={resultsRef} className="speaking-results">
        {attempt ? (
          <>
            <div className="section-block__head">
              <div>
                <h2 className="section-block__title">Your results</h2>
                <p className="section-block__sub">
                  {attempt.storyTitle}, passage {attempt.passageIndex + 1}
                </p>
              </div>
              <div className="speaking-results__actions">
                <Button variant="secondary" icon={RotateCcw} onClick={tryAgain}>
                  Try again
                </Button>
                {passages.length > passageIndex + 1 && (
                  <Button iconRight={ArrowRight} onClick={() => selectPassage(passageIndex + 1)}>
                    Next passage
                  </Button>
                )}
              </div>
            </div>
            <SpeakingResult attempt={attempt} />
          </>
        ) : (
          <div className="card results-placeholder">
            <Target size={22} aria-hidden="true" />
            <div>
              <p className="results-placeholder__title">3. Results appear here</p>
              <p className="results-placeholder__text">
                You'll get an overall score, pronunciation clarity, fluency and completeness, your words per minute,
                pauses, and the exact words to practise.
              </p>
            </div>
          </div>
        )}
      </div>

      {history?.storyAttempts?.length > 0 && (
        <section className="section-block">
          <div className="section-block__head">
            <div>
              <h2 className="section-block__title">
                <History size={18} aria-hidden="true" className="inline-icon" /> Your attempts on this story
              </h2>
              <p className="section-block__sub">Most recent first.</p>
            </div>
          </div>
          <ul className="attempt-list">
            {history.storyAttempts.map((a) => (
              <li key={a._id}>
                <Link to={`/speaking/attempts/${a._id}`} className="attempt-row">
                  <span className={`attempt-row__score attempt-row__score--${scoreTone(a.scores?.overall)}`}>
                    {a.scores?.overall}
                  </span>
                  <span className="attempt-row__main">
                    <span className="attempt-row__title">Passage {a.passageIndex + 1}</span>
                    <span className="attempt-row__meta">
                      Pronunciation {a.scores?.pronunciation} · Fluency {a.scores?.fluency} · Completeness{" "}
                      {a.scores?.completeness}
                      {a.metrics?.wordsPerMinute ? ` · ${a.metrics.wordsPerMinute} WPM` : ""}
                    </span>
                  </span>
                  <span className="attempt-row__time">{formatRelative(a.createdAt)}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
