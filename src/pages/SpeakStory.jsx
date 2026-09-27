import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, Headphones, Library, Mic, MicOff, RotateCcw, Sparkles, Type, Volume2 } from "lucide-react";
import Button from "../components/ui/Button";
import ErrorState, { Alert } from "../components/ui/ErrorState";
import { DifficultyBadge } from "../components/ui/Badge";
import { PageLoader } from "../components/ui/Spinner";
import StoryArt from "../components/illustrations/StoryArt";
import Mascot from "../components/illustrations/Mascot";
import RecordStage, { formatTime } from "../components/speaking/RecordStage";
import useWavRecorder from "../hooks/useWavRecorder";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getStoryById } from "../services/storyService";
import { analyzeStoryReading } from "../services/aiService";
import { getErrorMessage, isNotFound } from "../utils/errors";
import { readingMinutes, toParagraphs, wordCount } from "../utils/format";

// Matches the backend default (AI_MAX_AUDIO_SECONDS = 300). The server
// still validates the real limit and explains if a recording is too long.
const MAX_SECONDS = 300;

const PERMISSION = {
  granted: { tone: "success", icon: Mic, text: "Microphone ready" },
  denied: { tone: "danger", icon: MicOff, text: "Microphone blocked" },
  prompt: { tone: "neutral", icon: Mic, text: "We'll ask for your microphone" },
  unknown: { tone: "neutral", icon: Mic, text: "We'll ask for your microphone" },
  unsupported: { tone: "danger", icon: MicOff, text: "Recording isn't supported in this browser" },
};

export default function SpeakStory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  useDocumentTitle(story ? `Speak: ${story.title}` : "Start speaking");

  const recorder = useWavRecorder({ maxSeconds: MAX_SECONDS });
  const [phase, setPhase] = useState("record"); // record | uploading | analyzing
  const [uploadPct, setUploadPct] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setStory(await getStoryById(id));
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (phase === "record") return undefined;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500);
    return () => clearInterval(timer);
  }, [phase]);

  const analyze = async () => {
    if (!recorder.recording) return;
    setError("");
    setUploadPct(0);
    setElapsed(0);
    setPhase("uploading");
    try {
      const result = await analyzeStoryReading({
        audio: recorder.recording.blob,
        storyId: story._id,
        onUploadProgress: (e) => {
          if (!e.total) return;
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadPct(pct);
          if (pct >= 100) setPhase("analyzing");
        },
      });
      navigate(`/results/${result.analysisId || "unsaved"}`, { state: { result } });
    } catch (err) {
      setPhase("record");
      setError(getErrorMessage(err, "We couldn't analyse your recording. Please try again."));
    }
  };

  if (loading) return <PageLoader label="Getting your story ready…" />;
  if (loadError) {
    return (
      <div className="page">
        <ErrorState
          title={isNotFound(loadError) ? "Story not found" : "Couldn't open this story"}
          message={isNotFound(loadError) ? "It may have been removed." : getErrorMessage(loadError)}
          onRetry={isNotFound(loadError) ? undefined : load}
          action={
            <Button to="/stories" variant="secondary" size="sm" icon={Library}>
              All stories
            </Button>
          }
        />
      </div>
    );
  }

  const permission = PERMISSION[recorder.permission] || PERMISSION.unknown;
  const PermissionIcon = permission.icon;
  const busy = phase !== "record";

  return (
    <div className="page speak-page">
      <Link to={`/stories/${story._id}`} className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Back to story
      </Link>

      <header className="speak-head">
        <StoryArt story={story} size="sm" />
        <div className="speak-head__text">
          <p className="eyebrow">Speaking practice</p>
          <h1 className="speak-head__title">{story.title}</h1>
          <div className="speak-head__meta">
            <DifficultyBadge difficulty={story.difficulty} showLevel />
            <span>
              <Clock3 size={14} aria-hidden="true" /> ~{readingMinutes(story.content)} min aloud
            </span>
            <span>
              <Type size={14} aria-hidden="true" /> {wordCount(story.content)} words
            </span>
          </div>
        </div>
      </header>

      <div className="speak-layout">
        <section className="card speak-text" aria-labelledby="speak-text-title">
          <div className="speak-instruction">
            <Volume2 size={20} aria-hidden="true" />
            <div>
              <h2 id="speak-text-title">Read the story aloud.</h2>
              <p>Speak naturally and clearly. Start from the beginning and read to the end.</p>
            </div>
          </div>
          <div className={`speak-text__body ${recorder.status === "recording" ? "is-live" : ""}`}>
            {toParagraphs(story.content).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <aside className="card speak-panel" aria-label="Recorder">
          {phase === "record" ? (
            <>
              <div className={`mic-status mic-status--${permission.tone}`}>
                <PermissionIcon size={15} aria-hidden="true" /> {permission.text}
              </div>

              {recorder.status === "recorded" && recorder.recording ? (
                <div className="speak-review">
                  <Mascot size={88} mood="happy" />
                  <p className="speak-review__title">Nice reading! 🎉</p>
                  <p className="speak-review__sub">{formatTime(recorder.recording.durationSec)} recorded. Listen back if you like.</p>
                  <audio className="speak-review__audio" src={recorder.recording.url} controls preload="metadata" />
                  <Button size="lg" icon={Sparkles} onClick={analyze} fullWidth>
                    Analyze my speaking
                  </Button>
                  <Button variant="ghost" icon={RotateCcw} onClick={recorder.reset} fullWidth>
                    Record again
                  </Button>
                  <p className="speak-panel__note">Your recording is only sent when you press Analyze.</p>
                </div>
              ) : (
                <>
                  <RecordStage
                    status={recorder.status}
                    elapsed={recorder.elapsed}
                    level={recorder.level}
                    maxSeconds={MAX_SECONDS}
                    onStart={recorder.start}
                    onStop={recorder.stop}
                    disabled={recorder.permission === "unsupported"}
                  />
                  {recorder.status !== "recording" && (
                    <ul className="speak-tips">
                      <li>
                        <Headphones size={15} aria-hidden="true" /> Find a quiet place
                      </li>
                      <li>
                        <Mic size={15} aria-hidden="true" /> Hold the mic about a hand away
                      </li>
                    </ul>
                  )}
                </>
              )}

              {recorder.error && <Alert>{recorder.error}</Alert>}
              {error && <Alert>{error}</Alert>}
            </>
          ) : (
            <div className="processing" role="status" aria-live="polite">
              <Mascot size={110} mood="listening" className="processing__mascot" />
              <p className="processing__title">
                {phase === "uploading" ? "Sending your recording…" : "Analyzing your speaking… 🎤"}
              </p>
              {phase === "uploading" ? (
                <div className="processing__bar" role="progressbar" aria-valuenow={uploadPct} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                  <span style={{ width: `${uploadPct}%` }} />
                </div>
              ) : (
                <div className="processing__dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              <p className="processing__sub">
                {phase === "uploading"
                  ? `${uploadPct}% uploaded`
                  : `Listening to every word, checking pronunciation, pace and pauses. ${elapsed}s`}
              </p>
              <p className="processing__note">
                This usually takes 5–30 seconds. The very first analysis can take a minute while the speech model loads.
              </p>
            </div>
          )}
        </aside>
      </div>
      {busy && <span className="sr-only">Please wait. Your speaking is being analysed.</span>}
    </div>
  );
}
