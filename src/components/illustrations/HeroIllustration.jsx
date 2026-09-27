import Mascot from "./Mascot";

// Landing hero: Speaky reading aloud from an open book, with floating letters.
export default function HeroIllustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-art__glow" />
      <svg className="hero-art__book" viewBox="0 0 320 150" width="100%">
        <path d="M160 40C120 18 60 14 14 26v104c46-12 106-8 146 14z" fill="#fff" stroke="#E1D9FF" strokeWidth="3" />
        <path d="M160 40c40-22 100-26 146-14v104c-46-12-106-8-146 14z" fill="#fff" stroke="#E1D9FF" strokeWidth="3" />
        <path d="M160 40v104" stroke="#D6CFEC" strokeWidth="3" />
        <g stroke="#E8E4F6" strokeWidth="6" strokeLinecap="round">
          <path d="M40 52c30-6 62-5 94 4" />
          <path d="M40 72c30-6 62-5 94 4" />
          <path d="M40 92c30-6 62-5 94 4" />
          <path d="M186 56c32-9 64-10 94-4" />
          <path d="M186 76c32-9 64-10 94-4" />
          <path d="M186 96c32-9 64-10 72-6" />
        </g>
      </svg>
      <div className="hero-art__mascot">
        <Mascot size={170} mood="cheer" />
      </div>
      <span className="hero-art__bubble hero-art__bubble--a">A</span>
      <span className="hero-art__bubble hero-art__bubble--b">b</span>
      <span className="hero-art__bubble hero-art__bubble--c">c</span>
      <span className="hero-art__word hero-art__word--1">Hello!</span>
      <span className="hero-art__word hero-art__word--2">/ˈspiːk/</span>
      <svg className="hero-art__star hero-art__star--1" viewBox="0 0 20 20"><path d="M10 0c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z" /></svg>
      <svg className="hero-art__star hero-art__star--2" viewBox="0 0 20 20"><path d="M10 0c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z" /></svg>
    </div>
  );
}
