import { useCallback, useEffect, useState } from "react";
import { getSpeakingAnalyses, getSpeakingAnalysis } from "../services/aiService";
import { getErrorMessage } from "../utils/errors";

/*
 * Practice items for ONE analysis: the backend's practiceWords (pronunciation
 * issues, with IPA) PLUS readingAccuracy.wrongWords (words the recognizer heard
 * as a clearly different word), which the backend does not put in practiceWords.
 */
export function practiceItemsFrom(analysis) {
  const mistakes = analysis?.pronunciation?.mistakes || [];
  const items = new Map();
  (analysis?.practiceWords || []).forEach((p) => {
    const key = p.word.toLowerCase();
    if (items.has(key)) return;
    const mistake = mistakes.find((m) => m.word.toLowerCase() === key);
    items.set(key, { ...p, heardAs: mistake?.userPronunciation || null, explanation: mistake?.explanation || null });
  });
  (analysis?.readingAccuracy?.wrongWords || []).forEach((w) => {
    const word = String(w.expected || "").replace(/^[^\w']+|[^\w']+$/g, "");
    const key = word.toLowerCase();
    if (!word || items.has(key)) return;
    items.set(key, {
      word,
      correctPronunciation: null,
      ipa: null,
      heardAs: w.heard,
      severity: "moderate",
      practiceTip: `You said “${w.heard}”. Look at the word carefully and say “${word}” slowly, then at normal speed.`,
      repeatPractice: true,
    });
  });
  return [...items.values()];
}

/*
 * Collects practice words from the learner's most recent AI story analyses
 * (GET /api/ai/speaking-analyses + /:id). Newest first, one card per word.
 */
export default function usePracticeWords({ analyses = 5 } = {}) {
  const [state, setState] = useState({ loading: true, error: "", words: [], sourceCount: 0 });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const list = await getSpeakingAnalyses({ page: 1, limit: 20 });
      const recent = (list.analyses || []).filter((a) => a.story).slice(0, analyses);
      const details = await Promise.all(recent.map((a) => getSpeakingAnalysis(a._id).catch(() => null)));

      const seen = new Map();
      details.filter(Boolean).forEach((d) => {
        practiceItemsFrom(d.analysis).forEach((p) => {
          const key = p.word.toLowerCase();
          if (seen.has(key)) return;
          seen.set(key, {
            ...p,
            storyTitle: d.story?.title || null,
            storyId: d.story?._id || null,
            analysisId: d.analysisId,
            date: d.createdAt,
          });
        });
      });
      setState({ loading: false, error: "", words: [...seen.values()], sourceCount: details.filter(Boolean).length });
    } catch (err) {
      if (err?.response?.status === 401) return;
      setState({ loading: false, error: getErrorMessage(err, "We couldn't load your practice words."), words: [], sourceCount: 0 });
    }
  }, [analyses]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}