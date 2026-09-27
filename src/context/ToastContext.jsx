import { createContext, useCallback, useMemo, useRef, useState } from "react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";

export const ToastContext = createContext(null);

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    ({ type = "info", title, message, duration = 3800 }) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((current) => [...current.slice(-3), { id, type, title, message }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      show,
      success: (title, message) => show({ type: "success", title, message }),
      error: (title, message) => show({ type: "error", title, message }),
      info: (title, message) => show({ type: "info", title, message }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
              <Icon size={18} className="toast__icon" aria-hidden="true" />
              <div className="toast__body">
                {toast.title && <p className="toast__title">{toast.title}</p>}
                {toast.message && <p className="toast__message">{toast.message}</p>}
              </div>
              <button
                type="button"
                className="toast__close"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
