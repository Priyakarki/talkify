import { Link } from "react-router-dom";
import { ArrowRight, Clock3, Mic, Type } from "lucide-react";
import { DifficultyBadge } from "../ui/Badge";
import { Skeleton } from "../ui/Spinner";
import StoryArt from "../illustrations/StoryArt";
import ReadingTracker from "./ReadingTracker";
import { excerpt, readingMinutes, wordCount } from "../../utils/format";

// Kept for existing imports: small/medium story thumbnails now use StoryArt.
export function StoryCover({ story, size = "md" }) {
  return <StoryArt story={story} size={size} />;
}

export default function StoryCard({ story, status, to }) {
  const href = to || `/stories/${story._id}`;
  const cta = status === "completed" ? "Read again" : status === "in-progress" ? "Continue" : "Start";
  return (
    <article className="story-card">
      <Link to={href} className="story-card__art" tabIndex={-1} aria-hidden="true">
        <StoryArt story={story} size="md" />
        <span className="story-card__time">
          <Clock3 size={13} aria-hidden="true" /> {readingMinutes(story.content)} min
        </span>
      </Link>
      <div className="story-card__body">
        <div className="story-card__badges">
          <DifficultyBadge difficulty={story.difficulty} showLevel />
        </div>
        <h3 className="story-card__title">
          <Link to={href}>{story.title}</Link>
        </h3>
        <p className="story-card__excerpt">{excerpt(story.content, 110)}</p>
        <div className="story-card__meta">
          <span>
            <Type size={13} aria-hidden="true" /> {wordCount(story.content)} words
          </span>
          <ReadingTracker status={status} compact />
        </div>
        <div className="story-card__actions">
          <Link to={href} className="btn btn--primary btn--sm story-card__cta">
            <span>{cta}</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link to={`/stories/${story._id}/speak`} className="btn btn--soft btn--sm" aria-label={`Speak ${story.title} aloud`}>
            <Mic size={15} aria-hidden="true" />
            <span>Speak</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function StoryCardSkeleton() {
  return (
    <div className="story-card story-card--skeleton" aria-hidden="true">
      <Skeleton height={140} radius={0} />
      <div className="story-card__body">
        <Skeleton width={110} height={22} radius={999} />
        <Skeleton width="80%" height={20} />
        <Skeleton height={12} />
        <Skeleton width="70%" height={12} />
        <Skeleton width="45%" height={30} radius={12} />
      </div>
    </div>
  );
}
