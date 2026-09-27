import { Search, X } from "lucide-react";
import { DIFFICULTIES } from "../../utils/difficulty";

export default function StoryFilters({ search, onSearchChange, difficulty, onDifficultyChange }) {
  const tabs = [{ value: "", label: "All stories" }, ...DIFFICULTIES.map((d) => ({ value: d.value, label: d.label, level: d.level }))];

  return (
    <div className="filters">
      <div className="search-box">
        <Search size={18} className="search-box__icon" aria-hidden="true" />
        <input
          type="search"
          className="search-box__input"
          placeholder="Search by title or text…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search stories"
        />
        {search && (
          <button type="button" className="search-box__clear" onClick={() => onSearchChange("")} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="segmented" role="tablist" aria-label="Filter by difficulty">
        {tabs.map((tab) => (
          <button
            key={tab.value || "all"}
            type="button"
            role="tab"
            aria-selected={difficulty === tab.value}
            className={`segmented__item ${difficulty === tab.value ? "is-active" : ""}`}
            onClick={() => onDifficultyChange(tab.value)}
          >
            {tab.value && <span className={`segmented__dot segmented__dot--${tab.value}`} aria-hidden="true" />}
            {tab.label}
            {tab.level && <span className="segmented__level">{tab.level}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
