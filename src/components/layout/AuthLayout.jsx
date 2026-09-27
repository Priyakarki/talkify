import { BookOpen, Mic, Sparkles } from "lucide-react";
import Logo from "../ui/Logo";
import Mascot from "../illustrations/Mascot";

const POINTS = [
  { icon: BookOpen, text: "Read fun stories at your level" },
  { icon: Mic, text: "Speak aloud and record yourself" },
  { icon: Sparkles, text: "Get AI feedback on pronunciation and fluency" },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <Logo light size={38} tagline />
        <div className="auth__panel-body">
          <div className="auth__mascot">
            <Mascot size={150} mood="cheer" />
            <span className="auth__bubble">Let's practise speaking together!</span>
          </div>
          <ul className="auth__points">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="auth__point-icon">
                  <Icon size={17} aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth__panel-foot">Speak. Practice. Improve.</p>
      </aside>

      <main className="auth__main">
        <div className="auth__mobile-logo">
          <Logo size={34} tagline />
        </div>
        <div className="auth__card">
          <h1 className="auth__title">{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          {children}
        </div>
        {footer && <p className="auth__footer">{footer}</p>}
      </main>
    </div>
  );
}
