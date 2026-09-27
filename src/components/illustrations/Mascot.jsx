import { useId } from "react";

/*
 * "Speaky", the Speakify mascot: the logo's speech bubble with a face.
 * mood: happy | cheer | listening | thinking
 * Decorative by default (aria-hidden). Pass `label` if it carries meaning.
 */
export default function Mascot({ size = 120, mood = "happy", label, className = "" }) {
  const id = useId().replace(/:/g, "");
  const eyes =
    mood === "listening" ? (
      <g stroke="#1C1633" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M21 27q4-4 8 0" />
        <path d="M35 27q4-4 8 0" />
      </g>
    ) : (
      <g>
        <ellipse cx="25" cy="27" rx="4.2" ry="5" fill="#fff" />
        <ellipse cx="39" cy="27" rx="4.2" ry="5" fill="#fff" />
        <circle cx={mood === "thinking" ? 26.5 : 25.6} cy={mood === "thinking" ? 25.5 : 28} r="2.3" fill="#1C1633" />
        <circle cx={mood === "thinking" ? 40.5 : 39.6} cy={mood === "thinking" ? 25.5 : 28} r="2.3" fill="#1C1633" />
      </g>
    );
  const mouth =
    mood === "cheer" ? (
      <path d="M26 34.5q6 7.5 12 0z" fill="#1C1633" />
    ) : mood === "thinking" ? (
      <path d="M28 36h8" stroke="#1C1633" strokeWidth="2.6" strokeLinecap="round" />
    ) : (
      <path d="M26.5 34.5q5.5 5 11 0" stroke="#1C1633" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    );

  return (
    <svg
      className={`mascot mascot--${mood} ${className}`}
      width={size}
      height={size}
      viewBox="-6 -6 80 76"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <defs>
        <linearGradient id={`m-${id}`} x1="8" y1="6" x2="58" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6A4BFF" />
          <stop offset="1" stopColor="#A45CFF" />
        </linearGradient>
      </defs>
      <ellipse cx="33" cy="64" rx="20" ry="3" fill="#1C1633" opacity="0.08" />
      <g className="mascot__body">
        <path
          d="M22 8h22a16 16 0 0 1 16 16v8a16 16 0 0 1-16 16H27l-11 9.5a1.6 1.6 0 0 1-2.6-1.3V47.2A16 16 0 0 1 6 32v-8A16 16 0 0 1 22 8z"
          fill={`url(#m-${id})`}
        />
        <ellipse cx="18" cy="35" rx="3.4" ry="2.2" fill="#FF8FB8" opacity="0.8" />
        <ellipse cx="46" cy="35" rx="3.4" ry="2.2" fill="#FF8FB8" opacity="0.8" />
        {eyes}
        {mouth}
      </g>
      {(mood === "listening" || mood === "cheer") && (
        <g className="mascot__waves" stroke="#FFB020" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M65 20q5 8 0 16" />
          <path d="M70 15q8 13 0 26" opacity="0.6" />
        </g>
      )}
      {mood === "thinking" && (
        <g fill="#B9A8FF">
          <circle cx="62" cy="10" r="3" />
          <circle cx="68" cy="2" r="4.2" />
        </g>
      )}
      <path
        className="mascot__spark"
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
