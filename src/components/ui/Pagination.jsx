import { ChevronLeft, ChevronRight } from "lucide-react";

function buildPages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 1, totalPages - 2, totalPages - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push(`gap-${p}`);
    result.push(p);
  });
  return result;
}

export default function Pagination({ page, totalPages, onChange, disabled = false }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = buildPages(page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__btn pagination__btn--nav"
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={17} />
        <span className="pagination__label">Prev</span>
      </button>

      <div className="pagination__pages">
        {pages.map((p) =>
          typeof p === "string" ? (
            <span key={p} className="pagination__gap">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pagination__btn ${p === page ? "is-active" : ""}`}
              onClick={() => onChange(p)}
              disabled={disabled}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}
      </div>

      <span className="pagination__compact">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        className="pagination__btn pagination__btn--nav"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
      >
        <span className="pagination__label">Next</span>
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}
