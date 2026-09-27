// Reads the payload of the JWT issued by POST /api/auth/login.
// Payload shape from the backend: { userId, iat, exp }
export function decodeToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// Returns the expiry time in milliseconds, or null if unknown.
export function getTokenExpiry(token) {
  const payload = decodeToken(token);
  return payload?.exp ? payload.exp * 1000 : null;
}

export function isTokenExpired(token) {
  const expiry = getTokenExpiry(token);
  if (!expiry) return false; // Let the backend decide if we cannot read it.
  return Date.now() >= expiry;
}
