import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// Login and Register are only for logged-out users.
export default function GuestRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
