import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, AudioLines, BookOpen, CircleCheck, Clock3, Flame, History, Library, Mic, Sparkles, Target, Trophy } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import StatCard from "../components/ui/StatCard";
import { DifficultyBadge, StatusBadge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Spinner";
import { StoryCover } from "../components/stories/StoryCard";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useLearningData from "../hooks/useLearningData";
import usePracticeWords from "../hooks/usePracticeWords";
import ScoreTrendChart from "../components/learning/ScoreTrendChart";
import ResultList from "../components/learning/ResultList";
import Achievements from "../components/learning/Achievements";
import { ScoreBar } from "../components/speaking/ScoreRing";
import { getProgress, groupByStory, summarize } from "../services/progressService";
import { getStories } from "../services/storyService";
import { getErrorMessage } from "../utils/errors";
import { formatDateTime, readingMinutes } from "../utils/format";

const TABS = [
  { value: "", label: "All" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

function HistorySkeleton() {
  return (
    <div className="history-list">
      {[0, 1, 2, 3].map((i) => (
        <div className="history-item" key={i}>
          <Skeleton width={52} height={52} radius={12} />
          <div style={{ flex: 1, display: "grid", gap: 8 }}>
            <Skeleton width="40%" height={15} />
            <Skeleton width="25%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressMeter({ label, detail, value }) {
  return (
    <div className="progress-meter">
      <div className="progress-meter__top">
        <p className="progress-meter__label">{label}</p>
        <p className="progress-meter__value">{value}%</p>
      </div>
      <div className="progress-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <span style={{ width: `${value}%` }} />
      </div>
      <p className="progress-meter__detail">{detail}</p>
    </div>
  );
}

function SpeakingOverview() {
  const { loading, data } = useLearningData();
  const practice = usePracticeWords({ analyses: 5 });

  if (loading || !data) {
    return (
      <div className="stat-grid">
        {[0, 1, 2, 3].map((i) => (
          <StatCard key={i} icon={Sparkles} label=" " value="" loading />
        ))}
      </div>
    );
  }

  const trend = [...data.storyAnalyses]
    .slice(0, 20)
    .reverse()
    .map((a) => ({ id: a._id, score: a.overallScore, date: a.createdAt, title: a.storyTitle }));
  const av = data.averages;

  return (
    <>
      <div className="stat-grid">
        <StatCard icon={AudioLines} label="Speaking sessions" value={data.speakingSessions} hint="Story readings + quick practice" />
        <StatCard icon={Sparkles} tone="brand" label="Average score" value={av.overall ?? "–"} hint="Across your story readings" />
        <StatCard icon={Trophy} tone="success" label="Best score" value={data.bestStoryScore ?? "–"} hint="Your top story reading" />
        <StatCard
          icon={Flame}
          tone="warning"
          label="Learning streak"
          value={`${data.learningStreak.current} ${data.learningStreak.current === 1 ? "day" : "days"}`}
          hint={`Longest: ${data.learningStreak.longest} ${data.learningStreak.longest === 1 ? "day" : "days"}`}
        />
      </div>

      {data.storyAnalyses.length === 0 ? (
        <div className="card progress-empty">
          <EmptyState
            compact
            icon={Mic}
            title="No speaking results yet"
            description="Read a story aloud and your scores, trends and practice words will appear here."
            action={
              <Button to="/stories" icon={Mic}>
                Start Speaking
              </Button>
            }
          />
        </div>
      ) : (
        <div className="progress-speaking">
          <section className="card panel">
            <div className="panel__head">
              <h2 className="panel__title">
                <Sparkles size={18} aria-hidden="true" /> Overall score over time
              </h2>
              <span className="panel__muted-inline">Last {trend.length} story {trend.length === 1 ? "reading" : "readings"}</span>
            </div>
            <ScoreTrendChart points={trend} />
          </section>
          <section className="card panel">
            <div className="panel__head">
              <h2 className="panel__title">
                <Target size={18} aria-hidden="true" /> Average skills
              </h2>
            </div>
            <div className="skill-bars">
              <ScoreBar label="Pronunciation" score={av.pronunciation ?? 0} />
              <ScoreBar label="Fluency" score={av.fluency ?? 0} />
              <ScoreBar label="Reading accuracy" score={av.readingAccuracy ?? 0} />
              <ScoreBar label="Speed" score={av.speed ?? 0} description={av.wpm ? `Average ${av.wpm} words per minute` : undefined} />
              <ScoreBar label="Pause control" score={av.pause ?? 0} />
            </div>
          </section>
        </div>
      )}

      <div className="dash-row dash-row--2">
        <section className="card panel">
          <div className="panel__head">
            <h2 className="panel__title">
              <AudioLines size={18} aria-hidden="true" /> Recent attempts
            </h2>
          </div>
          {data.storyAnalyses.length ? (
            <ResultList analyses={data.storyAnalyses} limit={6} />
          ) : (
            <p className="panel__muted">Your story readings will be listed here.</p>
          )}
        </section>
        <section className="card panel practice-summary">
          <div className="panel__head">
            <h2 className="panel__title">
              <Target size={18} aria-hidden="true" /> Practice words
            </h2>
            <Link to="/practice-words" className="panel__link">
              Open
            </Link>
          </div>
          {practice.loading ? (
            <Skeleton height={60} radius={14} />
          ) : (
            <>
              <p className="practice-summary__count">
                <strong>{practice.words.length}</strong> {practice.words.length === 1 ? "word" : "words"} to practise
              </p>
              <p className="panel__muted-inline">From your last {practice.sourceCount || 0} story readings</p>
              {practice.words.length > 0 && (
                <div className="chips">
                  {practice.words.slice(0, 8).map((w) => (
                    <span key={w.word} className="chip">
                      {w.word}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <section className="card panel">
        <div className="panel__head">
          <h2 className="panel__title">
            <Trophy size={18} aria-hidden="true" /> Achievements
          </h2>
          <span className="panel__muted-inline">
            {data.achievements.filter((a) => a.unlocked).length} of {data.achievements.length} unlocked
          </span>
        </div>
        <Achievements items={data.achievements} />
      </section>
    </>
  );
}

export default function Progress() {
  useDocumentTitle("Progress");
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "";
  const status = TABS.some((t) => t.value === statusParam) ? statusParam : "";

  const [records, setRecords] = useState([]);
  const [libraryTotal, setLibraryTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // GET /api/progress is the source of truth for this user's progress.
      setRecords(await getProgress());
    } catch (err) {
      // A 401 is handled globally (the user is sent to /login).
      if (err?.response?.status !== 401) {
        setError(getErrorMessage(err, "We couldn't load your reading progress."));
      }
    } finally {
      setLoading(false);
    }
    // Library size is only used for the "library completed" meter; not critical.
    getStories({ page: 1, limit: 1 })
      .then((data) => setLibraryTotal(data.totalStories ?? null))
      .catch(() => setLibraryTotal(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const entries = useMemo(() => groupByStory(records), [records]);
  const summary = useMemo(() => summarize(entries), [entries]);
  const visible = status ? entries.filter((e) => e.status === status) : entries;
  const counts = { "": summary.started, "in-progress": summary.inProgress, completed: summary.completed };
  const libraryRate =
    libraryTotal && libraryTotal > 0 ? Math.min(100, Math.round((summary.completed / libraryTotal) * 100)) : null;

  const setStatus = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("status", value);
    else next.delete("status");
    setSearchParams(next);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Your progress"
        title="Your Speaking Journey"
        subtitle="Your real speaking scores, streaks, achievements and reading progress."
        actions={
          <Button to="/stories" icon={Library} variant="secondary">
            Browse stories
          </Button>
        }
      />

      <SpeakingOverview />

      <div className="section-block__head progress-reading-head">
        <div>
          <h2 className="section-block__title">
            <BookOpen size={20} aria-hidden="true" className="inline-icon" /> Reading progress
          </h2>
          <p className="section-block__sub">Every story you've started or finished, most recent first.</p>
        </div>
      </div>

      {error ? (
        <ErrorState title="Progress unavailable" message={error} onRetry={load} />
      ) : (
        <>
          <div className="stat-grid stat-grid--3">
            <StatCard icon={BookOpen} label="Stories started" value={summary.started} loading={loading} />
            <StatCard icon={CircleCheck} tone="success" label="Completed" value={summary.completed} loading={loading} />
            <StatCard icon={Clock3} tone="warning" label="In progress" value={summary.inProgress} loading={loading} />
          </div>

          {!loading && summary.started > 0 && (
            <div className="card progress-overview">
              <ProgressMeter
                label="Completion rate"
                value={summary.completionRate}
                detail={`${summary.completed} of ${summary.started} started ${summary.started === 1 ? "story" : "stories"} completed`}
              />
              {libraryRate !== null && (
                <ProgressMeter
                  label="Library completed"
                  value={libraryRate}
                  detail={`${summary.completed} of ${libraryTotal} ${libraryTotal === 1 ? "story" : "stories"} in the library`}
                />
              )}
            </div>
          )}

          <div className="tabs" role="tablist" aria-label="Filter progress">
            {TABS.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                className={`tabs__item ${status === tab.value ? "is-active" : ""}`}
                onClick={() => setStatus(tab.value)}
              >
                {tab.label}
                {!loading && <span className="tabs__count">{counts[tab.value]}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <HistorySkeleton />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={History}
              title="No reading progress yet"
              description="Open any story and press Start reading. It will appear here, and you can mark it complete when you finish."
              action={
                <Button to="/stories" iconRight={ArrowRight}>
                  Find your first story
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              compact
              icon={status === "completed" ? Target : Clock3}
              title={status === "completed" ? "Nothing completed yet" : "Nothing in progress"}
              description={
                status === "completed"
                  ? "Finish a story and press Mark as complete to see it here."
                  : "You've finished every story you started."
              }
            />
          ) : (
            <ul className="history-list">
              {visible.map((entry) => {
                const story = entry.story;
                return (
                  <li key={entry.key} className="history-item">
                    {story ? (
                      <StoryCover story={story} size="sm" />
                    ) : (
                      <div className="story-cover story-cover--removed story-cover--sm" aria-hidden="true" />
                    )}

                    <div className="history-item__main">
                      {story ? (
                        <Link to={`/stories/${story._id}`} className="history-item__title">
                          {story.title}
                        </Link>
                      ) : (
                        <p className="history-item__title history-item__title--muted">Story removed</p>
                      )}
                      <div className="history-item__meta">
                        {story && <DifficultyBadge difficulty={story.difficulty} />}
                        {story && <span>{readingMinutes(story.content)} min</span>}
                        <span>Started {formatDateTime(entry.startedAt)}</span>
                        {entry.status === "completed" && <span>Completed {formatDateTime(entry.completedAt)}</span>}
                      </div>
                    </div>

                    <div className="history-item__side">
                      <StatusBadge status={entry.status} />
                      {story && (
                        <div className="history-item__actions">
                          <Button to={`/speaking?storyId=${story._id}`} size="sm" variant="ghost" icon={Mic}>
                            Practise
                          </Button>
                          <Button
                            to={`/stories/${story._id}`}
                            size="sm"
                            variant={entry.status === "in-progress" ? "soft" : "secondary"}
                            iconRight={ArrowRight}
                          >
                            {entry.status === "in-progress" ? "Resume" : "Open"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
