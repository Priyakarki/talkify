import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  Clock3,
  Library,
  Mic,
  Minus,
  Pencil,
  Play,
  Plus,
  Type,
} from "lucide-react";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import { DifficultyBadge } from "../components/ui/Badge";
import StoryArt from "../components/illustrations/StoryArt";
import ReadingTracker from "../components/stories/ReadingTracker";
import { PageLoader } from "../components/ui/Spinner";
import useToast from "../hooks/useToast";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getStoryById } from "../services/storyService";
import {
  completeReading,
  getProgress,
  getProgressStoryId,
  groupByStory,
  startReading,
} from "../services/progressService";
import { getErrorMessage, isNotFound } from "../utils/errors";
import { formatDate, formatDateTime, readingMinutes, toParagraphs, wordCount } from "../utils/format";

const FONT_SIZES = [16, 18, 20, 22, 24];

export default function StoryReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [story, setStory] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressError, setProgressError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fontIndex, setFontIndex] = useState(1);

  useDocumentTitle(story?.title || "Reading");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgressError("");
    try {
      const storyData = await getStoryById(id);
      setStory(storyData);
    } catch (err) {
      setError(err);
      setLoading(false);
      return;
    }
    try {
      const all = await getProgress();
      setRecords(all.filter((r) => getProgressStoryId(r) === id));
    } catch (err) {
      setProgressError(getErrorMessage(err, "We couldn't load your progress for this story."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // One user + one story = one progress entry ("completed" wins over any
  // legacy "in-progress" duplicate).
  const entry = useMemo(() => groupByStory(records)[0] || null, [records]);
  const active = entry?.status === "in-progress" ? entry : null;
  const lastCompleted = entry?.status === "completed" ? entry : null;
  const currentStatus = entry?.status || null;

  const handleStart = async () => {
    if (busy || entry) return;
    setBusy(true);
    try {
      // The backend returns the existing record if this story was already started.
      const record = await startReading(id);
      setRecords((current) => [...current.filter((r) => r._id !== record._id), record]);
      if (record.status === "completed") {
        toast.info("Already completed", "This story is already in your completed list.");
      } else {
        toast.success("Reading started", "Take your time and read it out loud.");
      }
    } catch (err) {
      toast.error("Couldn't start reading", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    if (busy || !active) return;
    setBusy(true);
    try {
      // PUT /api/progress/:id uses the progress record id, not the story id.
      const updated = await completeReading(active.recordId);
      setRecords((current) => current.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)));
      toast.success("Story completed!", "Nice work. It's saved in your reading history.");
    } catch (err) {
      toast.error("Couldn't mark as complete", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader label="Opening story…" />;

  if (error) {
    return (
      <div className="page">
        <ErrorState
          title={isNotFound(error) ? "Story not found" : "Couldn't open this story"}
          message={
            isNotFound(error)
              ? "This story may have been removed, or the link is incorrect."
              : getErrorMessage(error)
          }
          onRetry={isNotFound(error) ? undefined : load}
          action={
            <Button to="/stories" variant="secondary" size="sm" icon={Library}>
              Back to stories
            </Button>
          }
        />
      </div>
    );
  }

  const paragraphs = toParagraphs(story.content);
  const fontSize = FONT_SIZES[fontIndex];

  const actionButton = active ? (
    <Button onClick={handleComplete} loading={busy} icon={CircleCheck} fullWidth size="lg">
      Mark as complete
    </Button>
  ) : lastCompleted ? (
    <Button to={`/stories/${story._id}/speak`} icon={Mic} variant="secondary" fullWidth size="lg">
      Speak it again
    </Button>
  ) : (
    <Button onClick={handleStart} loading={busy} icon={Play} fullWidth size="lg">
      Start reading
    </Button>
  );

  return (
    <div className="page reader-page">
      <button type="button" className="back-link" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/stories"))}>
        <ArrowLeft size={16} aria-hidden="true" /> Back
      </button>

      <header className="reader-hero">
        <StoryArt story={story} size="lg" className="reader-hero__art" />
        <div className="reader-hero__overlay">
          <div className="reader__badges">
            <DifficultyBadge difficulty={story.difficulty} showLevel />
          </div>
          <h1 className="reader-hero__title">{story.title}</h1>
          <div className="reader-hero__meta">
            <span>
              <Clock3 size={15} aria-hidden="true" /> {readingMinutes(story.content)} min read aloud
            </span>
            <span>
              <Type size={15} aria-hidden="true" /> {wordCount(story.content)} words
            </span>
            <ReadingTracker status={currentStatus} />
          </div>
        </div>
        <Link to={`/stories/${story._id}/speak`} className="speak-cta" aria-label={`Start speaking: read ${story.title} aloud`}>
          <span className="speak-cta__icon" aria-hidden="true">
            <Mic size={26} />
          </span>
          <span className="speak-cta__text">
            <strong>Start Speaking 🎤</strong>
            <small>Read it aloud and get AI feedback</small>
          </span>
        </Link>
      </header>

      <div className="reader-layout">
        <article className="reader card">
          <header className="reader__header reader__header--compact">
            <p className="reader__meta">
              <span>
                <CalendarDays size={15} aria-hidden="true" /> Added {formatDate(story.createdAt)}
              </span>
            </p>
          </header>

          <div className="reader__toolbar">
            <span className="reader__toolbar-label">Text size</span>
            <div className="size-control">
              <button
                type="button"
                onClick={() => setFontIndex((i) => Math.max(0, i - 1))}
                disabled={fontIndex === 0}
                aria-label="Smaller text"
              >
                <Minus size={15} />
              </button>
              <span>{fontSize}px</span>
              <button
                type="button"
                onClick={() => setFontIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
                disabled={fontIndex === FONT_SIZES.length - 1}
                aria-label="Larger text"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <div className="reader__content" style={{ fontSize }}>
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {!progressError && (
            <footer className="reader__end">
              {active ? (
                <>
                  <p>Finished reading out loud?</p>
                  <Button onClick={handleComplete} loading={busy} icon={CircleCheck}>
                    Mark as complete
                  </Button>
                </>
              ) : lastCompleted ? (
                <>
                  <p>
                    <CircleCheck size={17} aria-hidden="true" className="text-success" /> You completed this story.
                  </p>
                  <Button to="/stories" variant="secondary" icon={Library}>
                    Pick another story
                  </Button>
                </>
              ) : (
                <>
                  <p>Ready to practise? Start a session to track this story.</p>
                  <Button onClick={handleStart} loading={busy} icon={Play}>
                    Start reading
                  </Button>
                </>
              )}
            </footer>
          )}
        </article>

        <aside className="reader-aside">
          <div className="card session-card">
            <p className="session-card__label">Your session</p>
            {progressError ? (
              <ErrorState compact title="Progress unavailable" message={progressError} onRetry={load} />
            ) : (
              <>
                <div className="session-card__status">
                  {active ? (
                    <>
                      <span className="session-card__pulse" aria-hidden="true" />
                      <div>
                        <p className="session-card__title">Reading in progress</p>
                        <p className="session-card__sub">Started {formatDateTime(active.startedAt)}</p>
                      </div>
                    </>
                  ) : lastCompleted ? (
                    <>
                      <CircleCheck size={22} className="text-success" aria-hidden="true" />
                      <div>
                        <p className="session-card__title">Completed</p>
                        <p className="session-card__sub">Finished {formatDateTime(lastCompleted.completedAt)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Play size={20} className="text-brand" aria-hidden="true" />
                      <div>
                        <p className="session-card__title">Not started</p>
                        <p className="session-card__sub">Press start when you begin reading.</p>
                      </div>
                    </>
                  )}
                </div>

                {actionButton}

                <Link to={`/speaking?storyId=${story._id}`} className="session-card__practice">
                  <Mic size={15} aria-hidden="true" /> Practise short passages
                </Link>
              </>
            )}
          </div>

          <div className="card tips-card">
            <p className="session-card__label">Reading tips</p>
            <ul>
              <li>Read slowly and say every word clearly.</li>
              <li>Pause at full stops and commas.</li>
              <li>Read the story twice: once to understand it, once for fluency.</li>
            </ul>
          </div>

          <Link to={`/admin/stories/${story._id}/edit`} className="aside-link">
            <Pencil size={14} aria-hidden="true" /> Edit this story
          </Link>
        </aside>
      </div>

      <div className="mobile-speak-bar">
        <Button to={`/stories/${story._id}/speak`} icon={Mic} size="lg" fullWidth>
          Start Speaking 🎤
        </Button>
      </div>
    </div>
  );
}
