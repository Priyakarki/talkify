import { useState } from "react";
import { Library, Mic, Target } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Spinner";
import PracticeWordCard from "../components/learning/PracticeWordCard";
import PracticeWordModal from "../components/learning/PracticeWordModal";
import usePracticeWords from "../hooks/usePracticeWords";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function PracticeWords() {
  useDocumentTitle("Practice words");
  const { loading, error, words, sourceCount, reload } = usePracticeWords({ analyses: 5 });
  const [practising, setPractising] = useState(null);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Practice"
        title="Practice words"
        subtitle={
          sourceCount
            ? `Words from your last ${sourceCount} story ${sourceCount === 1 ? "reading" : "readings"}. Say each one 3 times and Speakify checks it.`
            : "Words that need a little extra practice appear here after you read a story aloud."
        }
        actions={
          <Button to="/stories" variant="secondary" icon={Library}>
            Read a story
          </Button>
        }
      />

      {loading ? (
        <div className="word-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="word-card">
              <Skeleton width="50%" height={24} />
              <Skeleton width="70%" height={14} />
              <Skeleton height={12} />
              <Skeleton width="40%" height={30} radius={12} />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load practice words" message={error} onRetry={reload} />
      ) : words.length === 0 ? (
        <EmptyState
          icon={Target}
          title={sourceCount ? "No words to practise. Great reading! 🎉" : "No practice words yet"}
          description={
            sourceCount
              ? "Your recent readings had no pronunciation problems. Try a harder story!"
              : "Read a story aloud and Speakify will pick the words you should practise."
          }
          action={
            <Button to="/stories" icon={Mic}>
              Start speaking
            </Button>
          }
        />
      ) : (
        <div className="word-grid">
          {words.map((w) => (
            <PracticeWordCard key={w.word} item={w} onPractise={setPractising} showSource />
          ))}
        </div>
      )}

      {practising && <PracticeWordModal item={practising} onClose={() => setPractising(null)} />}
    </div>
  );
}
