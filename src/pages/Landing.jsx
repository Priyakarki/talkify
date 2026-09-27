import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Flame, Library, Mic, Sparkles, Target, TrendingUp, Trophy, Waves } from "lucide-react";
import PublicNavbar from "../components/layout/PublicNavbar";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import StoryCard, { StoryCardSkeleton } from "../components/stories/StoryCard";
import HeroIllustration from "../components/illustrations/HeroIllustration";
import StoryArt from "../components/illustrations/StoryArt";
import Mascot from "../components/illustrations/Mascot";
import useAuth from "../hooks/useAuth";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getStories } from "../services/storyService";
import { getErrorMessage } from "../utils/errors";

const STEPS = [
  { icon: BookOpen, tone: "brand", title: "Read a story", text: "Pick a fun story at your level: easy, medium or hard." },
  { icon: Mic, tone: "coral", title: "Speak aloud", text: "Tap the mic and read it out loud, at your own pace." },
  { icon: Sparkles, tone: "sun", title: "Get AI feedback", text: "See your pronunciation, fluency, speed and pauses." },
  { icon: TrendingUp, tone: "mint", title: "Improve", text: "Practise tricky words and watch your scores grow." },
];

// Sample tiles only decorate the "story" feature card; they aren't real data.
const SAMPLE_TILES = [{ title: "a" }, { title: "Rocket" }, { title: "sea" }, { title: "garden!" }];

export default function Landing() {
  useDocumentTitle("");
  const { isAuthenticated } = useAuth();
  const [stories, setStories] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStories({ page: 1, limit: 3 });
      setStories(data.stories || []);
      setTotal(data.totalStories ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load stories right now."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const startTo = isAuthenticated ? "/stories" : "/register";

  return (
    <div className="landing">
      <PublicNavbar />

      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <p className="pill">
              <Sparkles size={14} aria-hidden="true" /> AI-powered English speaking practice
            </p>
            <h1 className="hero__title">
              Speak. Practice.
              <br />
              <span className="hero__highlight">Improve.</span>
            </h1>
            <p className="hero__text">
              Read fun stories aloud and get friendly AI feedback on your pronunciation, fluency and pace. Speakify helps
              you speak English with confidence, one story at a time.
            </p>
            <div className="hero__actions">
              <Button to={startTo} size="lg" icon={Mic}>
                Start Speaking
              </Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                See how it works
              </Button>
            </div>
            <ul className="hero__facts">
              <li>✓ Free to use</li>
              <li>✓ Works in your browser</li>
              {total > 0 && <li>✓ {total} stories to read</li>}
            </ul>
          </div>
          <HeroIllustration />
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section__head section__head--center">
            <p className="eyebrow">How it works</p>
            <h2 className="section__title">Four simple steps to confident speaking</h2>
          </div>
          <ol className="steps">
            {STEPS.map(({ icon: Icon, tone, title, text }, index) => (
              <li className={`step step--${tone}`} key={title}>
                <span className="step__number" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="step__icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--tinted" id="features">
        <div className="container">
          <div className="section__head section__head--center">
            <p className="eyebrow">Why learners love Speakify</p>
            <h2 className="section__title">Everything you need to practise speaking</h2>
          </div>

          <div className="features">
            <article className="feature feature--stories">
              <div className="feature__art feature__art--tiles" aria-hidden="true">
                {SAMPLE_TILES.map((t) => (
                  <StoryArt key={t.title} story={t} size="sm" />
                ))}
              </div>
              <div>
                <h3>
                  <Library size={20} aria-hidden="true" /> Story-based learning
                </h3>
                <p>Short, friendly stories grouped by level. Reading real sentences builds vocabulary and rhythm naturally.</p>
              </div>
            </article>

            <article className="feature feature--ai">
              <div className="feature__art" aria-hidden="true">
                <div className="mini-report">
                  <span className="mini-report__ring" />
                  <div className="mini-report__bars">
                    <span><i style={{ width: "86%" }} /></span>
                    <span><i style={{ width: "72%" }} /></span>
                    <span><i style={{ width: "64%" }} /></span>
                  </div>
                </div>
              </div>
              <div>
                <h3>
                  <Waves size={20} aria-hidden="true" /> AI speaking analysis
                </h3>
                <p>An open-source speech model listens to your reading and checks pronunciation, fluency, speed, pauses and accuracy.</p>
              </div>
            </article>

            <article className="feature feature--words">
              <div className="feature__art" aria-hidden="true">
                <div className="mini-word">
                  <strong>comfortable</strong>
                  <span>KUHM-fer-tuh-buhl</span>
                  <em>/ˈkʌmfɚtəbəl/</em>
                </div>
              </div>
              <div>
                <h3>
                  <Target size={20} aria-hidden="true" /> Pronunciation practice
                </h3>
                <p>See exactly which words to work on, how to say them (with IPA), and practise each word again.</p>
              </div>
            </article>

            <article className="feature feature--progress">
              <div className="feature__art feature__art--badges" aria-hidden="true">
                <span>
                  <Flame size={22} />
                </span>
                <span>
                  <Trophy size={22} />
                </span>
                <span>⭐</span>
              </div>
              <div>
                <h3>
                  <TrendingUp size={20} aria-hidden="true" /> Progress tracking
                </h3>
                <p>Daily goals, learning streaks, achievements and score history keep you motivated every day.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="stories">
        <div className="container">
          <div className="section__head section__head--row">
            <div>
              <p className="eyebrow">From the library</p>
              <h2 className="section__title">Stories waiting for you</h2>
            </div>
            <Button to={isAuthenticated ? "/stories" : "/register"} variant="secondary" iconRight={ArrowRight}>
              {isAuthenticated ? "See all stories" : "Sign up to read"}
            </Button>
          </div>

          {loading ? (
            <div className="story-grid">
              {[0, 1, 2].map((i) => (
                <StoryCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState title="Stories are unavailable" message={error} onRetry={loadStories} />
          ) : stories.length === 0 ? (
            <EmptyState icon={Library} title="No stories yet" description="New stories will appear here as soon as they are added." />
          ) : (
            <div className="story-grid">
              {stories.map((story) => (
                <StoryCard key={story._id} story={story} to={isAuthenticated ? `/stories/${story._id}` : "/login"} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section--cta">
        <div className="container">
          <div className="cta-band">
            <Mascot size={120} mood="cheer" className="cta-band__mascot" />
            <div>
              <h2>Your voice is ready. Let's practise!</h2>
              <p>Create a free account and read your first story aloud today.</p>
            </div>
            <Button to={startTo} size="lg" variant="light" icon={Mic}>
              Start Speaking
            </Button>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <Logo size={32} tagline />
          <nav className="site-footer__links" aria-label="Footer">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </nav>
          <p className="site-footer__copy">© {new Date().getFullYear()} Speakify. Speak. Practice. Improve.</p>
        </div>
      </footer>
    </div>
  );
}
