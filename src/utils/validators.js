import { DIFFICULTY_VALUES } from "./difficulty";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name.trim()) errors.name = "Name is required.";
  else if (name.trim().length < 2) errors.name = "Name should be at least 2 characters.";

  if (!email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Password is required.";
  else if (password.length < 6) errors.password = "Use at least 6 characters.";

  if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords don't match.";

  return errors;
}

export function validateStory({ title, content, difficulty }) {
  const errors = {};
  if (!title.trim()) errors.title = "Title is required.";
  else if (title.trim().length < 3) errors.title = "Title should be at least 3 characters.";
  else if (title.trim().length > 120) errors.title = "Keep the title under 120 characters.";

  if (!content.trim()) errors.content = "Story content is required.";
  else if (content.trim().length < 20) errors.content = "Story content should be at least 20 characters.";

  if (!DIFFICULTY_VALUES.includes(difficulty)) errors.difficulty = "Choose a difficulty.";
  return errors;
}

export function passwordStrength(password = "") {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  const labels = ["Too short", "Weak", "Okay", "Good", "Strong"];
  return { score, label: labels[score] };
}
