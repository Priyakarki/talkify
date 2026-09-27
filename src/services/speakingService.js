import axiosClient from "../api/axiosClient";

// GET /api/speaking/status   (auth)
// response: { success, engine: { name, model, dtype, status, error }, pronunciationDictionary, limits }
export async function getSpeakingStatus() {
  const { data } = await axiosClient.get("/speaking/status");
  return data;
}

// GET /api/speaking/passages/:storyId   (auth)
// response: { success, story: { _id, title, difficulty }, passages: [{ index, text, wordCount }] }
export async function getPassages(storyId) {
  const { data } = await axiosClient.get(`/speaking/passages/${storyId}`);
  return data;
}

// POST /api/speaking/analyze   (auth, multipart/form-data)
// fields: audio (WAV), storyId, passageIndex
// response: { success, message, attempt }
export async function analyzeSpeech({ blob, storyId, passageIndex }) {
  const form = new FormData();
  form.append("audio", blob, "recording.wav");
  form.append("storyId", storyId);
  form.append("passageIndex", String(passageIndex));
  const { data } = await axiosClient.post("/speaking/analyze", form, {
    // Lets the browser set the multipart boundary (axios drops the JSON default).
    headers: { "Content-Type": "multipart/form-data" },
    // Local speech recognition can take a while, especially the first time
    // (the model is downloaded once).
    timeout: 5 * 60 * 1000,
  });
  return data.attempt;
}

// GET /api/speaking/attempts?storyId=&page=&limit=   (auth)
// response: { success, page, limit, total, totalPages, summary, attempts }
export async function getAttempts({ storyId, page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (storyId) params.storyId = storyId;
  const { data } = await axiosClient.get("/speaking/attempts", { params });
  return data;
}

// GET /api/speaking/attempts/:id   (auth)
export async function getAttempt(id) {
  const { data } = await axiosClient.get(`/speaking/attempts/${id}`);
  return data.attempt;
}
