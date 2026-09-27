import { LoaderCircle, Mic, Square } from "lucide-react";

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/*
 * The big microphone. Visual only: recording logic stays in useWavRecorder.
 * status: idle | requesting | recording | recorded | error
 */
export default function RecordStage({ status, elapsed, level = 0, maxSeconds, onStart, onStop, disabled, size = "lg" }) {
  const recording = status === "recording";
  const requesting = status === "requesting";
  const scale = recording ? 1 + Math.min(0.35, level * 0.5) : 1;

  return (
    <div className={`record-stage record-stage--${size} ${recording ? "is-recording" : ""}`}>
      <div className="record-stage__mic-wrap">
        {recording && (
          <>
            <span className="record-stage__ring record-stage__ring--1" aria-hidden="true" />
            <span className="record-stage__ring record-stage__ring--2" aria-hidden="true" />
            <span className="record-stage__level" style={{ transform: `scale(${scale})` }} aria-hidden="true" />
          </>
        )}
        <button
          type="button"
          className="record-stage__mic"
          onClick={recording ? onStop : onStart}
          disabled={disabled || requesting}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {requesting ? (
            <LoaderCircle size={size === "lg" ? 40 : 28} className="spin" aria-hidden="true" />
          ) : recording ? (
            <Square size={size === "lg" ? 34 : 24} fill="currentColor" aria-hidden="true" />
          ) : (
            <Mic size={size === "lg" ? 42 : 30} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="record-stage__status" aria-live="polite">
        {recording ? (
          <>
            <p className="record-stage__listening">
              <span className="record-stage__dot" aria-hidden="true" /> Speakify is listening…
            </p>
            <p className="record-stage__timer">
              {formatTime(elapsed)}
              {maxSeconds ? <small> / {formatTime(maxSeconds)}</small> : null}
            </p>
            <div className="record-stage__bars" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, i) => {
                const wave = 0.3 + 0.7 * Math.abs(Math.sin((i + 1) * 1.3));
                return <span key={i} style={{ height: `${Math.max(12, Math.min(100, level * wave * 140))}%` }} />;
              })}
            </div>
          </>
        ) : requesting ? (
          <p className="record-stage__hint">Waiting for microphone permission…</p>
        ) : (
          <p className="record-stage__hint">Tap the microphone to start</p>
        )}
      </div>

      {recording && (
        <button type="button" className="btn btn--danger btn--lg record-stage__stop" onClick={onStop}>
          <Square size={16} fill="currentColor" aria-hidden="true" />
          <span>Stop recording</span>
        </button>
      )}
    </div>
  );
}
