import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { AUTH_EXPIRED_EVENT } from "../api/axiosClient";
import { loginUser, registerUser } from "../services/authService";
import { storage } from "../utils/storage";
import { getTokenExpiry, isTokenExpired } from "../utils/jwt";

export const AuthContext = createContext(null);

function readInitialSession() {
  const token = storage.getToken();
  const user = storage.getUser();
  if (!token || !user || isTokenExpired(token)) {
    storage.clear();
    return { token: null, user: null };
  }
  return { token, user };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readInitialSession);
  const [sessionMessage, setSessionMessage] = useState("");

  const endSession = useCallback((message = "") => {
    storage.clear();
    setSession({ token: null, user: null });
    setSessionMessage(message);
  }, []);

  // The axios client fires this event when the backend answers 401.
  useEffect(() => {
    const handleExpired = () => endSession("Your session has expired. Please log in again.");
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, [endSession]);

  // Log out automatically when the 7-day token expires while the app is open.
  useEffect(() => {
    if (!session.token) return undefined;
    const expiry = getTokenExpiry(session.token);
    if (!expiry) return undefined;
    const remaining = expiry - Date.now();
    // setTimeout can't handle delays over ~24.8 days; tokens last 7 days.
    const timer = setTimeout(
      () => endSession("Your session has expired. Please log in again."),
      Math.max(0, Math.min(remaining, 2147483000))
    );
    return () => clearTimeout(timer);
  }, [session.token, endSession]);

  // Keep several open tabs in sync (logging out in one logs out everywhere).
  useEffect(() => {
    const handleStorage = () => setSession(readInitialSession());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await loginUser({ email: email.trim(), password });
    storage.setToken(data.token);
    storage.setUser(data.user);
    setSession({ token: data.token, user: data.user });
    setSessionMessage("");
    return data.user;
  }, []);

  // The register endpoint does not return a token, so we log in right after
  // with the same credentials (using the existing login endpoint).
  const register = useCallback(
    async ({ name, email, password }) => {
      await registerUser({ name: name.trim(), email: email.trim(), password });
      return login({ email, password });
    },
    [login]
  );

  const logout = useCallback(() => endSession(""), [endSession]);

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token && session.user),
      sessionMessage,
      clearSessionMessage: () => setSessionMessage(""),
      login,
      register,
      logout,
    }),
    [session, sessionMessage, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
