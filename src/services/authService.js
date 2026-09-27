import axiosClient from "../api/axiosClient";

// POST /api/auth/register
// body:     { name, email, password }
// response: { success, message, user: { id, name, email } }   (no token)
export async function registerUser({ name, email, password }) {
  const { data } = await axiosClient.post("/auth/register", { name, email, password });
  return data;
}

// POST /api/auth/login
// body:     { email, password }
// response: { success, message, token, user: { id, name, email } }
export async function loginUser({ email, password }) {
  const { data } = await axiosClient.post("/auth/login", { email, password });
  return data;
}
