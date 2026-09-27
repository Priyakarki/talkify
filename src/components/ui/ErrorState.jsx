import { RefreshCw, TriangleAlert } from "lucide-react";
import Button from "./Button";

export default function ErrorState({ title = "Something went wrong", message, onRetry, action, compact = false }) {
  return (
    <div className={`error-state ${compact ? "error-state--compact" : ""}`} role="alert">
      <div className="error-state__icon">
        <TriangleAlert size={compact ? 20 : 24} aria-hidden="true" />
      </div>
      <h3 className="error-state__title">{title}</h3>
      {message && <p className="error-state__text">{message}</p>}
      <div className="error-state__actions">
        {onRetry && (
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
            Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

export function Alert({ tone = "error", children }) {
  if (!children) return null;
  return (
    <div className={`alert alert--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <TriangleAlert size={17} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
