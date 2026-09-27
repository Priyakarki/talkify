/*
 * Friendly illustrated scene for a story. Stories have no images in the API,
 * so a scene is picked deterministically from the story title (same story =
 * same picture everywhere). Purely decorative.
 */
const SCENES = [
  {
    name: "space",
    bg: ["#2B1D7A", "#5B3FF0"],
    draw: (
      <>
        <circle cx="18" cy="16" r="1.6" fill="#fff" /><circle cx="84" cy="12" r="1.2" fill="#fff" /><circle cx="70" cy="30" r="1" fill="#fff" /><circle cx="28" cy="48" r="1.2" fill="#fff" />
        <g transform="rotate(35 52 38)">
          <path d="M52 12c9 8 11 22 7 34H45c-4-12-2-26 7-34z" fill="#fff" />
          <circle cx="52" cy="28" r="4.5" fill="#6BC8FF" stroke="#5B3FF0" strokeWidth="2" />
          <path d="M45 40l-7 8 8-1zM59 40l7 8-8-1z" fill="#FF6B4A" />
          <path d="M47 47q5 12 10 0z" fill="#FFB020" />
        </g>
      </>
    ),
  },
  {
    name: "forest",
    bg: ["#DDF6EA", "#B8EDD3"],
    draw: (
      <>
        <circle cx="80" cy="16" r="8" fill="#FFB020" />
        <path d="M0 56q25-10 50 0t50 0v14H0z" fill="#7FD6A8" />
        <rect x="31" y="36" width="5" height="18" rx="2" fill="#9B6A45" />
        <circle cx="33.5" cy="30" r="12" fill="#16B979" />
        <rect x="61" y="40" width="4" height="14" rx="2" fill="#9B6A45" />
        <circle cx="63" cy="36" r="9" fill="#0E9C63" />
      </>
    ),
  },
  {
    name: "ocean",
    bg: ["#DDEEFF", "#B6DAFF"],
    draw: (
      <>
        <circle cx="20" cy="18" r="2.5" fill="#fff" /><circle cx="26" cy="10" r="1.6" fill="#fff" />
        <g>
          <ellipse cx="54" cy="36" rx="16" ry="10" fill="#FF6B4A" />
          <path d="M38 36l-9-8v16z" fill="#FF8C6E" />
          <circle cx="62" cy="33" r="2.4" fill="#fff" /><circle cx="62.6" cy="33" r="1.1" fill="#1C1633" />
        </g>
        <path d="M0 58q12-6 25 0t25 0 25 0 25 0v12H0z" fill="#2F8CFF" opacity="0.35" />
      </>
    ),
  },
  {
    name: "sunny",
    bg: ["#FFF3D6", "#FFE1A3"],
    draw: (
      <>
        <g stroke="#FFB020" strokeWidth="3" strokeLinecap="round">
          <path d="M50 4v6M50 38v6M31 24h6M63 24h6M36 10l4 4M60 34l4 4M64 10l-4 4M36 38l4-4" />
        </g>
        <circle cx="50" cy="24" r="10" fill="#FFB020" />
        <path d="M0 60q30-18 60-4t40 0v14H0z" fill="#FF9E57" opacity="0.55" />
      </>
    ),
  },
  {
    name: "night",
    bg: ["#241A5C", "#3D2C99"],
    draw: (
      <>
        <path d="M60 12a14 14 0 1 0 12 22 11 11 0 1 1-12-22z" fill="#FFE08A" />
        <path d="M22 18l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#fff" />
        <path d="M38 40l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#fff" />
        <circle cx="84" cy="48" r="1.4" fill="#fff" />
      </>
    ),
  },
  {
    name: "mountain",
    bg: ["#EFEBFF", "#D9CFFF"],
    draw: (
      <>
        <circle cx="22" cy="16" r="6" fill="#FF8FB8" opacity="0.8" />
        <path d="M10 62l26-38 18 26 12-14 24 26z" fill="#7B5CFF" />
        <path d="M36 24l7 10-4-2-3 4-3-4-4 2z" fill="#fff" />
      </>
    ),
  },
  {
    name: "garden",
    bg: ["#FFE8F2", "#FFD0E3"],
    draw: (
      <>
        <path d="M50 62V36" stroke="#16B979" strokeWidth="3" />
        <path d="M50 50q-10-2-12-10 10 0 12 10z" fill="#16B979" />
        <g fill="#FF5FA2">
          <circle cx="50" cy="22" r="6" /><circle cx="60" cy="28" r="6" /><circle cx="56" cy="38" r="6" /><circle cx="44" cy="38" r="6" /><circle cx="40" cy="28" r="6" />
        </g>
        <circle cx="50" cy="30" r="5" fill="#FFB020" />
      </>
    ),
  },
  {
    name: "balloon",
    bg: ["#E6F1FF", "#CFE4FF"],
    draw: (
      <>
        <ellipse cx="20" cy="46" rx="10" ry="4" fill="#fff" /><ellipse cx="80" cy="18" rx="9" ry="3.5" fill="#fff" />
        <path d="M50 8c11 0 18 8 18 17 0 9-9 15-12 22H44c-3-7-12-13-12-22 0-9 7-17 18-17z" fill="#FF6B4A" />
        <path d="M50 8c-4 0-7 8-7 17s4 15 5 22h4c1-7 5-13 5-22S54 8 50 8z" fill="#FFB020" />
        <path d="M44 47l2 6h8l2-6" stroke="#9B6A45" strokeWidth="1.5" fill="none" />
        <rect x="45" y="53" width="10" height="7" rx="2" fill="#9B6A45" />
      </>
    ),
  },
];

function hash(text = "") {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function sceneFor(story) {
  return SCENES[hash(story?.title || story?._id || "") % SCENES.length];
}

// size: xs (40px) | sm (52px) | md (card header) | lg (reader header)
export default function StoryArt({ story, size = "md", className = "" }) {
  const scene = sceneFor(story);
  const id = `sa-${scene.name}`;
  return (
    <div className={`story-art story-art--${size} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 70" preserveAspectRatio={size === "md" || size === "lg" ? "xMidYMid slice" : "xMidYMid meet"}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={scene.bg[0]} />
            <stop offset="1" stopColor={scene.bg[1]} />
          </linearGradient>
        </defs>
        <rect width="100" height="70" fill={`url(#${id})`} />
        {scene.draw}
      </svg>
    </div>
  );
}
