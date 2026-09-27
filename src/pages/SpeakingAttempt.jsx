import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Mic } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/Spinner";
import SpeakingResult from "../components/speaking/SpeakingResult";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getAttempt } from "../services/speakingService";
import { getErrorMessage, isNotFound } from "../utils/errors";
import { formatDateTime } from "../utils/format";

export default function SpeakingAttempt() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useDocumentTitle(attempt ? `Attempt: ${attempt.storyTitle}` : "Speaking attempt");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAttempt(await getAttempt(id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader label="Loading attempt…" />;

  if (error) {
    return (
      <div className="page">
        <ErrorState
          title={isNotFound(error) ? "Attempt not found" : "Couldn't load this attempt"}
          message={isNotFound(error) ? "It may belong to another account, or the link is wrong." : getErrorMessage(error)}
          onRetry={isNotFound(error) ? undefined : load}
          action={
            <Button to="/speaking" variant="secondary" size="sm" icon={ArrowLeft}>
              Speaking Practice
            </Button>
          }
        />
      </div>
    );
  }

  const practiseAgain = `/speaking?storyId=${attempt.story}${attempt.passageIndex ? `&passage=${attempt.passageIndex}` : ""}`;

  return (
    <div className="page">
      <Button to="/speaking" variant="ghost" size="sm" icon={ArrowLeft} className="back-btn">
        Speaking Practice
      </Button>
      <PageHeader
        eyebrow="Speaking attempt"
        title={attempt.storyTitle}
        subtitle={`Passage ${attempt.passageIndex + 1} · ${formatDateTime(attempt.createdAt)}`}
        actions={
          <Button to={practiseAgain} icon={Mic}>
            Practise again
          </Button>
        }
      />
      <div className="card attempt-passage">
        <p className="session-card__label">Passage</p>
        <p>{attempt.passageText}</p>
      </div>
      <SpeakingResult attempt={attempt} />
    </div>
  );
}
