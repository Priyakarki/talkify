import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Menu, Mic } from "lucide-react";
import Button from "../ui/Button";
import { LogoMark } from "../ui/Logo";
import useAuth from "../../hooks/useAuth";
import { initials } from "../../utils/format";

function getSection(pathname) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (/^\/stories\/[^/]+\/speak/.test(pathname)) return "Speaking";
  if (pathname.startsWith("/results")) return "Your results";
  if (pathname.startsWith("/practice-words")) return "Practice words";
  if (pathname.startsWith("/stories/")) return "Reading";
  if (pathname.startsWith("/stories")) return "Stories";
  if (pathname.startsWith("/progress")) return "Progress";
  if (pathname.startsWith("/speaking")) return "Speaking practice";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/admin")) return "Manage stories";
  return "Speakify";
}

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="icon-btn topbar__menu" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <Link to="/dashboard" className="topbar__mark" aria-label="Dashboard">
          <LogoMark size={30} title="Speakify" />
        </Link>
        <p className="topbar__section">{getSection(pathname)}</p>
      </div>

      <div className="topbar__right">
        {!pathname.startsWith("/dashboard") && (
          <Link to="/dashboard" className="icon-btn" aria-label="Go to Dashboard" title="Dashboard">
            <LayoutDashboard size={20} aria-hidden="true" />
          </Link>
        )}
        {!pathname.startsWith("/stories") && !pathname.startsWith("/speaking") && (
          <Button to="/stories" size="sm" icon={Mic} className="topbar__browse">
            Start speaking
          </Button>
        )}
        <Link to="/profile" className="avatar" aria-label="Your profile" title={user?.name}>
          {initials(user?.name)}
        </Link>
      </div>
    </header>
  );
}