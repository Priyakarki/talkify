import axiosClient from "../api/axiosClient";

// GET /api/stories?search=&difficulty=&page=&limit=   (public)
// response: { success, page, limit, totalStories, totalPages, stories: [] }
export async function getStories({ page = 1, limit = 9, search = "", difficulty = "" } = {}) {
  const params = { page, limit };
  if (search.trim()) params.search = search.trim();
  if (difficulty) params.difficulty = difficulty;
  const { data } = await axiosClient.get("/stories", { params });
  return data;
}

// GET /api/stories/:id   (public)
// response: { success, story }
export async function getStoryById(id) {
  const { data } = await axiosClient.get(`/stories/${id}`);
  return data.story;
}

// POST /api/stories   (auth)
// body: { title, content, difficulty }
// response: { success, message, story }
export async function createStory({ title, content, difficulty }) {
  const { data } = await axiosClient.post("/stories", { title, content, difficulty });
  return data;
}

// PUT /api/stories/:id   (auth)
// body: any of { title, content, difficulty }
// response: { success, message, story }
export async function updateStory(id, { title, content, difficulty }) {
  const { data } = await axiosClient.put(`/stories/${id}`, { title, content, difficulty });
  return data;
}

// DELETE /api/stories/:id   (auth)
// response: { success, message }
export async function deleteStory(id) {
  const { data } = await axiosClient.delete(`/stories/${id}`);
  return data;
}
