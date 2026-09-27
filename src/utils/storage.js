// Everything the app keeps in localStorage lives behind these helpers.
const TOKEN_KEY = "bolobuddy_token";
const USER_KEY = "bolobuddy_user";

function safeGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode, blocked site data). Ignore.
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const storage = {
  getToken() {
    return safeGet(TOKEN_KEY);
  },
  setToken(token) {
    safeSet(TOKEN_KEY, token);
  },
  getUser() {
    const raw = safeGet(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user) {
    safeSet(USER_KEY, JSON.stringify(user));
  },
  clear() {
    safeRemove(TOKEN_KEY);
    safeRemove(USER_KEY);
  },
};
