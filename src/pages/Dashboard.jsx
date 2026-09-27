import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Library, Mic, Sparkles, Target, Trophy } from "lucide-react";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { DifficultyBadge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Spinner";
import Mascot from "../components/illustrations/Mascot";
import StoryArt from "../components/illustrations/StoryArt";
import ScoreRing from "../components/speaking/ScoreRing";
import DailyGoal from "../components/learning/DailyGoal";
import StreakCard from "../components/learning/StreakCard";
import Achievements from "../components/learning/Achievements";
import ResultList from "../components/learning/ResultList";
import useAuth from "../hooks/useAuth";
import useLearningData from "../hooks/useLearningData";
import usePracticeWords from "../hooks/usePracticeWords";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getStories } from "../services/storyService";
import { DAILY_SPEAKING_GOAL, levelTone } from "../utils/learning";
import { excerpt, firstName, formatRelative, readingMinutes } from "../utils/format";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Panel({ title, icon: Icon, link, linkLabel, children, className = "" }) {
  return (
    <section className={`card panel ${className}`}>
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon size={18} aria-hidden="true" /> {title}
        </h2>
        {link && (
          <Link to={link} className="panel__link">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  useDocumentTitle("Home");
  const { user } = useAuth();
  const { loading, error, data, reload } = useLearningData();
  const practice = usePracticeWords({ analyses: 1 });
  const [stories, setStories] = useState({ loading: true, list: [] });

  useEffect(() => {
    getStories({ page: 1, limit: 20 })
      .then((d) => setStories({ loading: false, list: d.stories || [] }))
      .catch(() => setStories({ loading: false, list: [] }));
  }, []);

  const inProgress = useMemo(() => (data ? data.entries.filter((e) => e.status === "in-progress" && e.story).slice(0, 3) : []), [data]);
  const recommended = useMemo(() => {
    if (!stories.list.length) return null;
    const touched = new Set((data?.entries || []).map((e) => e.storyId));
    return stories.list.find((s) => !touched.has(s._id)) || stories.list[0];
  }, [stories.list, data]);

  const speakTo = inProgress[0]?.story ? `/stories/${inProgress[0].story._id}/speak` : recommended ? `/stories/${recommended._id}/speak` : "/stories";

  let heroSub = "Let's read a story aloud today.";
  if (data) {
    if (data.todaySpeaking >= DAILY_SPEAKING_GOAL) heroSub = "You've reached today's speaking goal. Amazing work! 🎉";
    else if (data.learningStreak.current > 0) heroSub = `You're on a ${data.learningStreak.current}-day streak. Keep it going!`;
    else if (data.speakingSessions > 0) heroSub = "Welcome back! A short practice today makes a big difference.";
  }

  return (
    <div className="page dash">
      <section className="welcome">
        <div className="welcome__text">
          <p className="welcome__hello">
            {greeting()}, {firstName(user?.name)}!
          </p>
          <h1 className="welcome__title">Ready to practice? 🎤</h1>
          <p className="welcome__sub">{heroSub}</p>
          <div className="welcome__actions">
            <Button to={speakTo} size="lg" variant="light" icon={Mic}>
              Start Speaking
            </Button>
            <Button to="/stories" size="lg" variant="glass" icon={Library}>
              Browse stories
            </Button>
          </div>
        </div>
        <Mascot size={150} mood="cheer" className="welcome__mascot" />
      </section>

      {error ? (
        <ErrorState title="We couldn't load your progress" message={error} onRetry={reload} />
      ) : (
        <>
          <div className="dash-row dash-row--3">
            {loading || !data ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="card panel">
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="70%" height={28} />
                  <Skeleton height={12} />
                </div>
              ))
            ) : (
              <>
                <DailyGoal done={data.todaySpeaking} />
                <StreakCard streak={data.learningStreak} week={data.week} />
                <section className="card journey">
                  <p className="card-kicker">
                    <Sparkles size={14} aria-hidden="true" /> Your Speaking Journey
                  </p>
                  {data.latestAnalysis ? (
                    <div className="journey__body">
                      <ScoreRing score={data.averages.overall} size={92} stroke={9} label="Average" />
                      <div className="journey__facts">
                        <p>
                          Latest:{" "}
                          <strong>
                            {data.latestAnalysis.overallScore}
                          </strong>{" "}
                          <span className={`level-badge level-badge--sm level-badge--${levelTone(data.latestAnalysis.level)}`}>{data.latestAnalysis.level}</span>
                        </p>
                        <p>
                          <strong>{data.speakingSessions}</strong> speaking {data.speakingSessions === 1 ? "session" : "sessions"}
                        </p>
                        <p>
                          <strong>{data.reading.completed}</strong> {data.reading.completed === 1 ? "story" : "stories"} completed
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="journey__empty">
                      <p>Read your first story aloud to see your speaking scores here.</p>
                      <p className="journey__mini">
                        <strong>{data.reading.completed}</strong> {data.reading.completed === 1 ? "story" : "stories"} completed ·{" "}
                        <strong>{data.speakingSessions}</strong> speaking {data.speakingSessions === 1 ? "session" : "sessions"}
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <div className="dash-row dash-row--2">
            <Panel title="Continue Reading" icon={BookOpen} link={inProgress.length ? "/progress?status=in-progress" : undefined} linkLabel="View all">
              {loading ? (
                <Skeleton height={60} radius={14} />
              ) : inProgress.length === 0 ? (
                <EmptyState compact icon={BookOpen} title="Nothing in progress" description="Start a new story below. Your open stories will wait for you here." />
              ) : (
                <ul className="continue-list">
                  {inProgress.map((e) => (
                    <li key={e.key} className="continue-item">
                      <StoryArt story={e.story} size="sm" />
                      <div className="continue-item__text">
                        <Link to={`/stories/${e.story._id}`} className="continue-item__title">
                          {e.story.title}
                        </Link>
                        <p className="continue-item__meta">
                          <DifficultyBadge difficulty={e.story.difficulty} /> started {formatRelative(e.startedAt)}
                        </p>
                      </div>
                      <Button to={`/stories/${e.story._id}/speak`} size="sm" variant="soft" icon={Mic} aria-label={`Speak ${e.story.title}`}>
                        Speak
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <section className="card recommend">
              {stories.loading ? (
                <Skeleton height={180} radius={20} />
              ) : !recommended ? (
                <EmptyState compact icon={Library} title="No stories yet" description="Add a story in Manage stories." action={<Button to="/admin/stories/new" size="sm">Add a story</Button>} />
              ) : (
                <>
                  <StoryArt story={recommended} size="md" className="recommend__art" />
                  <div className="recommend__body">
                    <p className="card-kicker">⭐ Recommended story</p>
                    <h2 className="recommend__title">{recommended.title}</h2>
                    <p className="recommend__meta">
                      <DifficultyBadge difficulty={recommended.difficulty} showLevel /> {readingMinutes(recommended.content)} min
                    </p>
                    <p className="recommend__excerpt">{excerpt(recommended.content, 100)}</p>
                    <div className="recommend__actions">
                      <Button to={`/stories/${recommended._id}/speak`} icon={Mic}>
                        Start Speaking
                      </Button>
                      <Button to={`/stories/${recommended._id}`} variant="secondary" iconRight={ArrowRight}>
                        Read first
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <div className="dash-row dash-row--2">
            <Panel title="Recent Results" icon={Sparkles} link={data?.storyAnalyses?.length ? "/progress" : undefined} linkLabel="All results">
              {loading ? (
                <Skeleton height={120} radius={14} />
              ) : data?.speakingError ? (
                <p className="panel__muted">Speaking results are unavailable right now.</p>
              ) : !data?.storyAnalyses?.length ? (
                <EmptyState compact icon={Mic} title="No results yet" description="Read a story aloud and your AI results will appear here." action={<Button to={speakTo} size="sm" icon={Mic}>Start Speaking</Button>} />
              ) : (
                <ResultList analyses={data.storyAnalyses} limit={4} />
              )}
            </Panel>

            <Panel title="Practice Words" icon={Target} link={practice.words.length ? "/practice-words" : undefined} linkLabel="Practise now">
              {practice.loading ? (
                <Skeleton height={120} radius={14} />
              ) : practice.words.length === 0 ? (
                <EmptyState
                  compact
                  icon={Target}
                  title={practice.sourceCount ? "No tricky words. Nice! 🎉" : "No practice words yet"}
                  description={practice.sourceCount ? "Your latest reading had no pronunciation problems." : "After you read a story aloud, words to practise show up here."}
                />
              ) : (
                <ul className="mini-words">
                  {practice.words.slice(0, 4).map((w) => (
                    <li key={w.word}>
                      <strong>{w.word}</strong>
                      <span>{w.correctPronunciation || ""}</span>
                      {w.ipa && <em lang="en-fonipa">{w.ipa}</em>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <section className="card panel">
            <div className="panel__head">
              <h2 className="panel__title">
                <Trophy size={18} aria-hidden="true" /> Achievements
              </h2>
              {data && (
                <span className="panel__muted-inline">
                  {data.achievements.filter((a) => a.unlocked).length} of {data.achievements.length} unlocked
                </span>
              )}
            </div>
            {loading || !data ? <Skeleton height={90} radius={14} /> : <Achievements items={data.achievements} compact />}
          </section>
        </>
      )}
    </div>
  );
}
