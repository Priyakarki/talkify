import { useId } from "react";
import { Link } from "react-router-dom";

// Speakify mark: a speech bubble with sound-wave bars and a confidence spark.
// Static copies of the logo live in src/assets/brand/ and public/favicon.svg.
export function LogoMark({ size = 36, title }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="logo-mark"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
    >
      <defs>
        <linearGradient id={`spk-${id}`} x1="8" y1="6" x2="58" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6A4BFF" />
          <stop offset="1" stopColor="#A45CFF" />
        </linearGradient>
      </defs>
      <path
        d="M22 8h22a16 16 0 0 1 16 16v8a16 16 0 0 1-16 16H27l-11 9.5a1.6 1.6 0 0 1-2.6-1.3V47.2A16 16 0 0 1 6 32v-8A16 16 0 0 1 22 8z"
        fill={`url(#spk-${id})`}
      />
      <g fill="#fff" className="logo-mark__bars">
        <rect x="19" y="23" width="5" height="10" rx="2.5" />
        <rect x="27" y="17" width="5" height="22" rx="2.5" />
        <rect x="35" y="21" width="5" height="14" rx="2.5" />
        <rect x="43" y="25" width="5" height="6" rx="2.5" />
      </g>
      <path
        d="M54 2c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z"
        fill="#FFB020"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  );
}

// light = for dark backgrounds (white wordmark)
export default function Logo({ to = "/", size = 36, light = false, tagline = false }) {
  return (
    <Link to={to} className={`logo ${light ? "logo--light" : ""}`} aria-label="Speakify home">
      <LogoMark size={size} />
      <span className="logo__words">
        <span className="logo__text">
          Speak<span>ify</span>
        </span>
        {tagline && <span className="logo__tagline">Speak. Practice. Improve.</span>}
      </span>
    </Link>
  );
}
