import { useEffect, useState } from "react";
import { CircleCheck, RotateCcw, TriangleAlert, X } from "lucide-react";
import RecordStage from "../speaking/RecordStage";
import useWavRecorder from "../../hooks/useWavRecorder";
import { analyzeStoryReading } from "../../services/aiService";
import { getErrorMessage } from "../../utils/errors";
import Button from "../ui/Button";
import { Alert } from "../ui/ErrorState";

/*
 * Real word practice using the existing AI endpoint:
 * the learner says the word, we send it with storyText = the word to
 * POST /api/ai/analyze-speaking, and show whether it was recognised clearly
 * (analysis.words statuses).
 */
export default function PracticeWordModal({ item, onClose }) {
  const recorder = useWavRecorder({ maxSeconds: 12 });
  const [state, setState] = useState({ status: "idle", error: "", result: null });

  const { status: recStatus, recording, reset } = recorder;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && state.status !== "analyzing" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, state.status]);

  // Analyse automatically once the short recording stops.
  useEffect(() => {
    if (recStatus !== "recorded" || !recording || state.status !== "idle") return;
    setState({ status: "analyzing", error: "", result: null });
    const word = item.word;
    analyzeStoryReading({ audio: recording.blob, storyText: word })
      .then((res) => {
        const words = res.analysis?.words || [];
        const clear = words.filter((w) => ["correct", "accent"].includes(w.status)).length;
        const mistake = res.analysis?.pronunciation?.mistakes?.[0] || null;
        setState({ status: "done", error: "", result: { clear, total: words.length || 1, mistake, transcript: res.analysis?.transcript } });
      })
      .catch((err) => setState({ status: "error", error: getErrorMessage(err, "We couldn't check that recording."), result: null }));
  }, [recStatus, recording, item.word, state.status]);

  const again = () => {
    reset();
    setState({ status: "idle", error: "", result: null });
  };

  const r = state.result;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && state.status !== "analyzing" && onClose()}>
      <div className="modal modal--practice" role="dialog" aria-modal="true" aria-labelledby="practice-title">
        <button type="button" className="modal__close" onClick={onClose} aria-label="Close practice" disabled={state.status === "analyzing"}>
          <X size={18} />
        </button>
        <p className="card-kicker">Practise a word</p>
        <h2 id="practice-title" className="practice-modal__word">
          {item.word}
        </h2>
        <p className="practice-modal__say">
          {item.correctPronunciation && <span className="word-card__respell">{item.correctPronunciation}</span>}
          {item.ipa && <span lang="en-fonipa"> {item.ipa}</span>}
        </p>
        {item.practiceTip && <p className="practice-modal__tip">{item.practiceTip}</p>}

        {state.status === "idle" && (
          <>
            <p className="practice-modal__instruction">
              Tap the mic, say <strong>“{item.word}”</strong> clearly, then tap stop.
            </p>
            <RecordStage
              size="md"
              status={recorder.status}
              elapsed={recorder.elapsed}
              level={recorder.level}
              maxSeconds={12}
              onStart={recorder.start}
              onStop={recorder.stop}
            />
            {recorder.error && <Alert>{recorder.error}</Alert>}
          </>
        )}

        {state.status === "analyzing" && (
          <div className="processing processing--inline" role="status">
            <span className="processing__spinner" aria-hidden="true" />
            <p>Checking your pronunciation… 🎤</p>
          </div>
        )}

        {state.status === "error" && (
          <>
            <Alert>{state.error}</Alert>
            <Button icon={RotateCcw} onClick={again} fullWidth>
              Try again
            </Button>
          </>
        )}

        {state.status === "done" && r && (
          <div className="practice-modal__result">
            <div className={`practice-modal__verdict ${r.clear === r.total ? "is-good" : "is-work"}`}>
              {r.clear === r.total ? <CircleCheck size={22} aria-hidden="true" /> : <TriangleAlert size={22} aria-hidden="true" />}
              <p>{r.clear === r.total ? "Said clearly. Well done! 🎉" : "Not quite clear yet. Keep practising!"}</p>
            </div>
            {r.mistake && <p className="practice-modal__detail">{r.mistake.explanation}</p>}
            {r.transcript && <p className="practice-modal__heard">We heard: “{r.transcript}”</p>}
            <div className="practice-modal__actions">
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
              <Button icon={RotateCcw} onClick={again}>
                Try again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}