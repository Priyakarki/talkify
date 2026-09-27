import { useCallback, useEffect, useState } from "react";
import { BookOpen, CircleCheck, Clock3, Copy, KeyRound, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import ErrorState from "../components/ui/ErrorState";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import useDocumentTitle from "../hooks/useDocumentTitle";
import useLearningData from "../hooks/useLearningData";
import Achievements from "../components/learning/Achievements";
import { Skeleton } from "../components/ui/Spinner";
import { getDashboard } from "../services/progressService";
import { getErrorMessage } from "../utils/errors";
import { getTokenExpiry } from "../utils/jwt";
import { formatDateTime, initials } from "../utils/format";

export default function Profile() {
  useDocumentTitle("Profile");
  const { user, token, logout } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await getDashboard());
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load your stats."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const learning = useLearningData();
  const expiry = getTokenExpiry(token);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(user?.id || "");
      toast.success("User ID copied");
    } catch {
      toast.error("Couldn't copy", "Your browser blocked clipboard access.");
    }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Account" title="Your profile" />

      <div className="profile-grid">
        <section className="card profile-card">
          <div className="profile-card__head">
            <span className="avatar avatar--xl">{initials(user?.name)}</span>
            <div>
              <h2 className="profile-card__name">{user?.name}</h2>
              <p className="profile-card__email">{user?.email}</p>
            </div>
          </div>

          <dl className="detail-list">
            <div className="detail-list__row">
              <dt>
                <UserRound size={16} aria-hidden="true" /> Full name
              </dt>
              <dd>{user?.name}</dd>
            </div>
            <div className="detail-list__row">
              <dt>
                <Mail size={16} aria-hidden="true" /> Email
              </dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="detail-list__row">
              <dt>
                <KeyRound size={16} aria-hidden="true" /> User ID
              </dt>
              <dd className="detail-list__mono">
                <span>{user?.id}</span>
                <button type="button" className="icon-btn icon-btn--sm" onClick={copyId} aria-label="Copy user ID">
                  <Copy size={14} />
                </button>
              </dd>
            </div>
            <div className="detail-list__row">
              <dt>
                <ShieldCheck size={16} aria-hidden="true" /> Session expires
              </dt>
              <dd>{expiry ? formatDateTime(expiry) : "—"}</dd>
            </div>
          </dl>

          <div className="profile-card__actions">
            <Button variant="danger" icon={LogOut} onClick={logout}>
              Log out
            </Button>
          </div>
        </section>

        <section className="profile-stats">
          <h2 className="section-block__title">Learning summary</h2>
          {error ? (
            <ErrorState compact message={error} onRetry={load} />
          ) : (
            <div className="stat-grid stat-grid--stack">
              <StatCard icon={BookOpen} label="Stories started" value={stats?.totalStoriesRead ?? 0} loading={loading} />
              <StatCard
                icon={CircleCheck}
                tone="success"
                label="Completed"
                value={stats?.completedStories ?? 0}
                loading={loading}
              />
              <StatCard
                icon={Clock3}
                tone="warning"
                label="In progress"
                value={stats?.inProgressStories ?? 0}
                loading={loading}
              />
            </div>
          )}
        </section>
      </div>

      <section className="card panel profile-achievements">
        <div className="panel__head">
          <h2 className="panel__title">🏆 Achievements</h2>
          {learning.data && (
            <span className="panel__muted-inline">
              {learning.data.achievements.filter((a) => a.unlocked).length} of {learning.data.achievements.length} unlocked
              {" · "}
              {learning.data.speakingSessions} speaking {learning.data.speakingSessions === 1 ? "session" : "sessions"}
            </span>
          )}
        </div>
        {learning.loading || !learning.data ? <Skeleton height={90} radius={14} /> : <Achievements items={learning.data.achievements} />}
      </section>
    </div>
  );
}
