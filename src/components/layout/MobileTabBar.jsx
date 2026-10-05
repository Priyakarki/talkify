import { NavLink } from "react-router-dom";
import { LayoutDashboard, Library, Mic, TrendingUp, UserRound } from "lucide-react";

const TABS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stories", label: "Stories", icon: Library },
  { to: "/speaking", label: "Speak", icon: Mic, primary: true },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/profile", label: "Profile", icon: UserRound },
];

// Bottom navigation on phones (the sidebar becomes a drawer).
export default function MobileTabBar() {
  return (
    <nav className="tabbar" aria-label="Quick navigation">
      {TABS.map(({ to, label, icon: Icon, primary }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `tabbar__item ${primary ? "tabbar__item--primary" : ""} ${isActive ? "is-active" : ""}`}>
          <span className="tabbar__icon">
            <Icon size={primary ? 24 : 20} aria-hidden="true" />
          </span>
          <span className="tabbar__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}