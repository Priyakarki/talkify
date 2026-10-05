import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, Library, LogOut, Mic, SquarePen, Target, TrendingUp, UserRound, X } from "lucide-react";
import Logo from "../ui/Logo";
import Mascot from "../illustrations/Mascot";
import useAuth from "../../hooks/useAuth";
import { initials } from "../../utils/format";

export const LEARN_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stories", label: "Stories", icon: Library },
  { to: "/speaking", label: "Speaking practice", icon: Mic },
  { to: "/practice-words", label: "Practice words", icon: Target },
  { to: "/progress", label: "Progress", icon: TrendingUp },
];

const ACCOUNT_LINKS = [
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/admin/stories", label: "Manage stories", icon: SquarePen },
];

function NavGroup({ title, links, onNavigate }) {
  return (
    <div className="sidebar__group">
      <p className="sidebar__group-title">{title}</p>
      <ul>
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={onNavigate}
              className={({ isActive }) => `sidebar__link ${isActive ? "is-active" : ""}`}
            >
              <span className="sidebar__icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      <div className={`sidebar-overlay ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Main navigation">
        <div className="sidebar__top">
          <Logo to="/dashboard" size={34} />
          <button type="button" className="icon-btn sidebar__close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          <NavGroup title="Learn" links={LEARN_LINKS} onNavigate={onClose} />
          <NavGroup title="Account" links={ACCOUNT_LINKS} onNavigate={onClose} />
        </nav>

        <Link to="/stories" className="sidebar__cta" onClick={onClose}>
          <Mascot size={52} mood="happy" />
          <span>
            <strong>Ready to speak?</strong>
            <small>Pick a story and read it aloud 🎤</small>
          </span>
        </Link>

        <div className="sidebar__footer">
          <NavLink to="/profile" className="sidebar__user" onClick={onClose}>
            <span className="avatar avatar--sm">{initials(user?.name)}</span>
            <span className="sidebar__user-text">
              <span className="sidebar__user-name">{user?.name}</span>
              <span className="sidebar__user-email">{user?.email}</span>
            </span>
          </NavLink>
          <button type="button" className="sidebar__logout" onClick={logout}>
            <LogOut size={17} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}