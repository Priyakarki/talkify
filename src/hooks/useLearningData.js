import { useCallback, useEffect, useMemo, useState } from "react";
import { getProgress, groupByStory, summarize } from "../services/progressService";
import { getSpeakingAnalyses } from "../services/aiService";
import { getAttempts } from "../services/speakingService";
import { average, buildAchievements, computeStreak, countToday, recentDays } from "../utils/learning";
import { getErrorMessage } from "../utils/errors";

/*
 * Loads the learner's real data from the existing APIs and derives
 * streaks, goals, averages and achievements from it.
 *   GET /api/progress
 *   GET /api/ai/speaking-analyses (full-story AI analyses)
 *   GET /api/speaking/attempts    (quick passage practice)
 */
export default function useLearningData() {
  const [state, setState] = useState({ loading: true, error: "", raw: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    const [progress, analyses, attempts] = await Promise.allSettled([
      getProgress(),
      getSpeakingAnalyses({ page: 1, limit: 50 }),
      getAttempts({ page: 1, limit: 50 }),
    ]);

    if (progress.status === "rejected" && progress.reason?.response?.status === 401) return; // handled globally
    if (progress.status === "rejected") {
      setState({ loading: false, error: getErrorMessage(progress.reason, "We couldn't load your progress."), raw: null });
      return;
    }

    setState({
      loading: false,
      error: "",
      raw: {
        records: progress.value,
        analyses: analyses.status === "fulfilled" ? analyses.value : null,
        attempts: attempts.status === "fulfilled" ? attempts.value : null,
        speakingError: analyses.status === "rejected" ? getErrorMessage(analyses.reason) : "",
      },
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { records, analyses, attempts, speakingError } = state.raw;

    const entries = groupByStory(records);
    const reading = summarize(entries);

    const analysisList = analyses?.analyses || [];
    const storyAnalyses = analysisList.filter((a) => a.story); // excludes single-word practice
    const attemptList = attempts?.attempts || [];

    const speakingDates = [...analysisList.map((a) => a.createdAt), ...attemptList.map((a) => a.createdAt)];
    const readingDates = entries.flatMap((e) => [e.startedAt, e.completedAt]).filter(Boolean);

    const speakingStreak = computeStreak(speakingDates);
    const learningStreak = computeStreak([...speakingDates, ...readingDates]);
    const speakingSessions = (analyses?.total || 0) + (attempts?.total || 0);

    const averages = {
      overall: average(storyAnalyses.map((a) => a.overallScore)),
      pronunciation: average(storyAnalyses.map((a) => a.pronunciationScore)),
      fluency: average(storyAnalyses.map((a) => a.fluencyScore)),
      readingAccuracy: average(storyAnalyses.map((a) => a.readingAccuracyScore)),
      speed: average(storyAnalyses.map((a) => a.speedScore)),
      pause: average(storyAnalyses.map((a) => a.pauseScore)),
      wpm: average(storyAnalyses.map((a) => a.speed?.wpm)),
    };
    const bestStoryScore = storyAnalyses.length ? Math.max(...storyAnalyses.map((a) => a.overallScore)) : null;

    return {
      entries,
      reading,
      analyses: analysisList,
      storyAnalyses,
      attempts: attemptList,
      speakingSessions,
      storyAnalysesTotal: analyses?.total || 0,
      speakingStreak,
      learningStreak,
      week: recentDays([...speakingDates, ...readingDates], 7),
      todaySpeaking: countToday(speakingDates),
      averages,
      bestStoryScore,
      latestAnalysis: storyAnalyses[0] || null,
      achievements: buildAchievements({
        completedStories: reading.completed,
        speakingSessions,
        longestSpeakingStreak: speakingStreak.longest,
        bestStoryScore,
      }),
      speakingError,
    };
  }, [state.raw]);

  return { loading: state.loading, error: state.error, data, reload: load };
}
