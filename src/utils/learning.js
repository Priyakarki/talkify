// Learning helpers. Everything is derived from real API data
// (progress records, AI speaking analyses, quick-practice attempts).

// App setting (not a statistic): how many speaking sessions make a day's goal.
export const DAILY_SPEAKING_GOAL = 2;

export function dayKey(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDay(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/*
 * Consecutive active days. The current streak still counts if the last active
 * day was yesterday (you can keep it alive today).
 */
export function computeStreak(dates) {
  const days = new Set(dates.map(dayKey).filter(Boolean));
  const today = new Date();
  const activeToday = days.has(dayKey(today));

  let current = 0;
  let cursor = activeToday ? today : shiftDay(today, -1);
  while (days.has(dayKey(cursor))) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }

  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  sorted.forEach((key) => {
    const d = new Date(`${key}T12:00:00`);
    run = prev && dayKey(shiftDay(prev, 1)) === key ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  });

  return { current, longest, activeToday, activeDays: days.size };
}

// Last n days (oldest first) for a week strip.
export function recentDays(dates, n = 7) {
  const days = new Set(dates.map(dayKey).filter(Boolean));
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = shiftDay(today, i - (n - 1));
    return {
      key: dayKey(d),
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      active: days.has(dayKey(d)),
      isToday: i === n - 1,
    };
  });
}

export function countToday(dates) {
  const today = dayKey(new Date());
  return dates.filter((d) => dayKey(d) === today).length;
}

export function average(values) {
  const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// Encouraging headline based on the real overall score.
export function scoreMessage(score) {
  if (score >= 90) return { title: "Outstanding! 🌟", subtitle: "You read like a star. Keep challenging yourself!", mood: "cheer" };
  if (score >= 75) return { title: "Great job! 🌟", subtitle: "Your speaking is clear and confident.", mood: "cheer" };
  if (score >= 60) return { title: "Nice work! Keep practicing!", subtitle: "You're on the right track. A few words need attention.", mood: "happy" };
  if (score >= 40) return { title: "You're improving! 💪", subtitle: "Practise the words below and try again.", mood: "happy" };
  return { title: "Good start! 🌱", subtitle: "Every try makes you better. Let's practise together.", mood: "thinking" };
}

export function levelTone(level) {
  return (
    {
      Excellent: "mint",
      Good: "brand",
      Developing: "sun",
      "Needs Improvement": "coral",
      Beginner: "pink",
    }[level] || "brand"
  );
}

export function scoreTone(score) {
  if (score === null || score === undefined) return "neutral";
  if (score >= 80) return "good";
  if (score >= 60) return "ok";
  return "low";
}

/*
 * Achievements unlock only from real data. Each has progress toward a target.
 */
export function buildAchievements({ completedStories, speakingSessions, longestSpeakingStreak, bestStoryScore }) {
  const list = [
    { id: "first-story", emoji: "📖", title: "First Story", description: "Finish your first story", value: completedStories, target: 1 },
    { id: "first-words", emoji: "🎤", title: "First Words", description: "Complete a speaking session", value: speakingSessions, target: 1 },
    { id: "bookworm", emoji: "📚", title: "Bookworm", description: "Finish 3 stories", value: completedStories, target: 3 },
    { id: "on-a-roll", emoji: "🔥", title: "On a Roll", description: "Speak 3 days in a row", value: longestSpeakingStreak, target: 3 },
    { id: "champion", emoji: "🏆", title: "Practice Champion", description: "Complete 10 speaking sessions", value: speakingSessions, target: 10 },
    { id: "star-speaker", emoji: "⭐", title: "Star Speaker", description: "Score 80+ reading a story", value: bestStoryScore ?? 0, target: 80, isScore: true },
  ];
  return list.map((a) => ({
    ...a,
    unlocked: (a.value || 0) >= a.target,
    progress: Math.min(1, (a.value || 0) / a.target),
  }));
}
