import axiosClient from "../api/axiosClient";

// POST /api/progress   (auth)
// body:     { storyId }
// response: { success, message, alreadyExists, progress: { _id, user, story, status, ... } }
// One user + one story = one record: if the story was already started or
// completed, the backend returns the existing record instead of a new one.
export async function startReading(storyId) {
  const { data } = await axiosClient.post("/progress", { storyId });
  return data.progress;
}

// PUT /api/progress/:id   (auth)
// NOTE: ":id" is the progress record _id, NOT the story id.
// response: { success, message, progress: { ..., status: "completed", completedAt } }
export async function completeReading(progressId) {
  const { data } = await axiosClient.put(`/progress/${progressId}`);
  return data.progress;
}

// GET /api/progress   (auth)
// response: { success, progress: [ { _id, status, story: { ...full story } | null, ... } ] }
export async function getProgress() {
  const { data } = await axiosClient.get("/progress");
  return data.progress || [];
}

// GET /api/progress/dashboard   (auth)
// response: { success, dashboard: { totalStoriesRead, completedStories, inProgressStories } }
export async function getDashboard() {
  const { data } = await axiosClient.get("/progress/dashboard");
  return data.dashboard;
}

// ---------- helpers for working with progress records ----------

// progress.story is a full object from GET /progress (populated),
// but only an id string in the POST/PUT responses.
export function getProgressStoryId(record) {
  if (!record?.story) return null;
  return typeof record.story === "object" ? record.story._id : record.story;
}

export function sortByRecent(records) {
  return [...records].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );
}

// Builds { [storyId]: "completed" | "in-progress" } — "in-progress" wins,
// because it means the learner has an open session for that story.
export function buildStatusMap(records) {
  const map = {};
  records.forEach((record) => {
    const storyId = getProgressStoryId(record);
    if (!storyId) return;
    if (record.status === "in-progress" || !map[storyId]) {
      map[storyId] = record.status;
    }
  });
  return map;
}

// Turns raw records into ONE entry per story. The backend now guarantees one
// record per user+story, but databases created before that fix may still hold
// duplicates, so we merge them here too ("completed" wins over "in-progress").
export function groupByStory(records) {
  const groups = new Map();

  records.forEach((record) => {
    const storyId = getProgressStoryId(record);
    const key = storyId || `removed-${record._id}`;
    const current = groups.get(key);
    const started = record.createdAt;
    const completedAt = record.status === "completed" ? record.completedAt || record.updatedAt : null;

    if (!current) {
      groups.set(key, {
        key,
        storyId,
        story: typeof record.story === "object" ? record.story : null,
        status: record.status,
        recordId: record._id,
        startedAt: started,
        completedAt,
        updatedAt: record.updatedAt || record.createdAt,
      });
      return;
    }

    if (!current.story && typeof record.story === "object") current.story = record.story;
    if (new Date(started) < new Date(current.startedAt)) current.startedAt = started;
    if (new Date(record.updatedAt) > new Date(current.updatedAt)) current.updatedAt = record.updatedAt;
    if (record.status === "completed") {
      if (current.status !== "completed" || new Date(completedAt) < new Date(current.completedAt)) {
        current.completedAt = completedAt;
      }
      current.status = "completed";
      current.recordId = record._id;
    }
  });

  return [...groups.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

// Summary numbers calculated from the grouped entries.
export function summarize(entries) {
  const started = entries.length;
  const completed = entries.filter((e) => e.status === "completed").length;
  const inProgress = started - completed;
  const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;
  return { started, completed, inProgress, completionRate };
}
