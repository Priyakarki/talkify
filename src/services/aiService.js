import axiosClient from "../api/axiosClient";

// POST /api/ai/analyze-speaking   (auth, multipart/form-data)
// fields: audio (File/Blob), storyId OR storyText
// response: { success, analysisId, story, analysis: { overallScore, level, pronunciation, fluency,
//             speed, pauses, readingAccuracy, feedback, practiceWords, words, transcript, ... } }
export async function analyzeStoryReading({ audio, storyId, storyText, fileName = "recording.wav", onUploadProgress }) {
  const form = new FormData();
  form.append("audio", audio, audio.name || fileName);
  if (storyId) form.append("storyId", storyId);
  else if (storyText) form.append("storyText", storyText);
  const { data } = await axiosClient.post("/ai/analyze-speaking", form, {
    headers: { "Content-Type": "multipart/form-data" }, // browser adds the boundary
    timeout: 5 * 60 * 1000, // local speech recognition can take a while for long stories
    onUploadProgress, // real upload progress for the processing screen
  });
  return data;
}

// GET /api/ai/speaking-analyses?storyId=&page=&limit=
export async function getSpeakingAnalyses({ storyId, page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (storyId) params.storyId = storyId;
  const { data } = await axiosClient.get("/ai/speaking-analyses", { params });
  return data;
}

// GET /api/ai/speaking-analyses/:id
export async function getSpeakingAnalysis(id) {
  const { data } = await axiosClient.get(`/ai/speaking-analyses/${id}`);
  return data;
}
