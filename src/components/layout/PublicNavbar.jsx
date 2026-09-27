import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, Mic, X } from "lucide-react";
import Logo from "../ui/Logo";
import Button from "../ui/Button";
import useAuth from "../../hooks/useAuth";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#stories", label: "Stories" },
];

export default function PublicNavbar() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="public-nav">
      <div className="container public-nav__inner">
        <Logo size={36} />

        <nav className={`public-nav__links ${open ? "is-open" : ""}`} aria-label="Landing page sections">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="public-nav__mobile-actions">
            {isAuthenticated ? (
              <Button to="/dashboard" fullWidth iconRight={ArrowRight}>
                Go to dashboard
              </Button>
            ) : (
              <>
                <Button to="/login" variant="secondary" fullWidth>
                  Log in
                </Button>
                <Button to="/register" fullWidth icon={Mic}>
                  Start Speaking
                </Button>
              </>
            )}
          </div>
        </nav>

        <div className="public-nav__actions">
          {isAuthenticated ? (
            <Button to="/dashboard" size="sm" iconRight={ArrowRight}>
              Dashboard
            </Button>
          ) : (
            <>
              <Link to="/login" className="public-nav__login">
                Log in
              </Link>
              <Button to="/register" size="sm" icon={Mic}>
                Start Speaking
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="icon-btn public-nav__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
