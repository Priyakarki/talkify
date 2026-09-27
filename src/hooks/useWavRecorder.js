import { useCallback, useEffect, useRef, useState } from "react";
import { downsample, encodeWav, mergeChunks, TARGET_SAMPLE_RATE } from "../utils/wavEncoder";

// Runs on the audio thread and forwards raw microphone samples.
const WORKLET_SOURCE = `
class BoloBuddyRecorder extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) this.port.postMessage(channel.slice(0));
    return true;
  }
}
registerProcessor("bolobuddy-recorder", BoloBuddyRecorder);
`;

function getAudioContextClass() {
  return typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : undefined;
}

export function isRecordingSupported() {
  return Boolean(typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia && getAudioContextClass());
}

function describeMicError(error) {
  switch (error?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Microphone access was blocked. Allow the microphone for this site in your browser's address bar, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No microphone was found. Connect a microphone and try again.";
    case "NotReadableError":
      return "Your microphone is being used by another app. Close it and try again.";
    default:
      return error?.message || "Couldn't start the microphone.";
  }
}

/*
 * Records the microphone with the Web Audio API and produces a WAV Blob.
 * status: idle | requesting | recording | recorded | error
 * permission: unknown | prompt | granted | denied | unsupported
 * Nothing is uploaded here. The caller decides when to submit the Blob.
 */
export default function useWavRecorder({ maxSeconds = 60 } = {}) {
  const [status, setStatus] = useState("idle");
  const [permission, setPermission] = useState(isRecordingSupported() ? "unknown" : "unsupported");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [recording, setRecording] = useState(null); // { blob, url, durationSec }

  const refs = useRef({});

  // Live permission status where the browser supports it (Chrome, Edge, Safari).
  useEffect(() => {
    let permissionStatus;
    let cancelled = false;
    if (!isRecordingSupported()) return undefined;
    navigator.permissions
      ?.query({ name: "microphone" })
      .then((result) => {
        if (cancelled) return;
        permissionStatus = result;
        setPermission(result.state);
        result.onchange = () => setPermission(result.state);
      })
      .catch(() => {}); // Firefox doesn't support querying the microphone permission.
    return () => {
      cancelled = true;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const cleanupAudio = useCallback(() => {
    const r = refs.current;
    clearInterval(r.timer);
    cancelAnimationFrame(r.raf);
    try {
      r.source?.disconnect();
      r.node?.disconnect();
      r.silent?.disconnect();
    } catch {
      // already disconnected
    }
    r.stream?.getTracks().forEach((t) => t.stop());
    if (r.context && r.context.state !== "closed") r.context.close().catch(() => {});
    refs.current = { url: r.url };
    setLevel(0);
  }, []);

  const clearRecording = useCallback(() => {
    if (refs.current.url) URL.revokeObjectURL(refs.current.url);
    refs.current.url = null;
    setRecording(null);
    setElapsed(0);
  }, []);

  const stop = useCallback(() => {
    const r = refs.current;
    if (!r.context) return;
    const sampleRate = r.context.sampleRate;
    const chunks = r.chunks || [];
    cleanupAudio();

    const raw = mergeChunks(chunks);
    const samples = downsample(raw, sampleRate, TARGET_SAMPLE_RATE);
    const durationSec = samples.length / TARGET_SAMPLE_RATE;
    if (durationSec < 1) {
      setStatus("error");
      setError("The recording was shorter than 1 second. Please try again.");
      return;
    }
    const blob = encodeWav(samples, TARGET_SAMPLE_RATE);
    const url = URL.createObjectURL(blob);
    refs.current.url = url;
    setRecording({ blob, url, durationSec });
    setStatus("recorded");
  }, [cleanupAudio]);

  const start = useCallback(async () => {
    setError("");
    clearRecording();

    if (!isRecordingSupported()) {
      setPermission("unsupported");
      setStatus("error");
      setError("This browser can't record audio. Please use a recent Chrome, Edge, Firefox or Safari.");
      return;
    }
    if (!window.isSecureContext) {
      setStatus("error");
      setError("The microphone only works on https:// or http://localhost. Open Speakify on localhost.");
      return;
    }

    setStatus("requesting");
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setPermission("granted");
    } catch (err) {
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") setPermission("denied");
      setStatus("error");
      setError(describeMicError(err));
      return;
    }

    try {
      const AudioContextClass = getAudioContextClass();
      const context = new AudioContextClass();
      if (context.state === "suspended") await context.resume();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      const silent = context.createGain();
      silent.gain.value = 0;

      const chunks = [];
      let node;
      if (context.audioWorklet && typeof AudioWorkletNode !== "undefined") {
        const moduleUrl = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
        await context.audioWorklet.addModule(moduleUrl);
        URL.revokeObjectURL(moduleUrl);
        node = new AudioWorkletNode(context, "bolobuddy-recorder");
        node.port.onmessage = (event) => chunks.push(event.data);
      } else {
        // Older browsers: ScriptProcessorNode fallback.
        node = context.createScriptProcessor(4096, 1, 1);
        node.onaudioprocess = (event) => chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      }

      source.connect(analyser);
      source.connect(node);
      node.connect(silent);
      silent.connect(context.destination);

      const startedAt = performance.now();
      refs.current = { ...refs.current, stream, context, source, node, silent, chunks, startedAt };

      refs.current.timer = setInterval(() => {
        const seconds = (performance.now() - startedAt) / 1000;
        setElapsed(seconds);
        if (seconds >= maxSeconds) stop();
      }, 100);

      const data = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 6));
        refs.current.raf = requestAnimationFrame(tick);
      };
      tick();

      setElapsed(0);
      setStatus("recording");
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      cleanupAudio();
      setStatus("error");
      setError(describeMicError(err));
    }
  }, [clearRecording, cleanupAudio, maxSeconds, stop]);

  const reset = useCallback(() => {
    cleanupAudio();
    clearRecording();
    setError("");
    setStatus("idle");
  }, [cleanupAudio, clearRecording]);

  // Release the microphone if the user leaves the page mid-recording.
  useEffect(
    () => () => {
      cleanupAudio();
      if (refs.current.url) URL.revokeObjectURL(refs.current.url);
    },
    [cleanupAudio]
  );

  return { status, permission, error, elapsed, level, recording, start, stop, reset };
}
