import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Wrapper that renders a label, the control, and a hint or error message.
export function Field({ label, htmlFor, error, hint, required, children, aside }) {
  return (
    <div className={`field ${error ? "field--error" : ""}`}>
      {(label || aside) && (
        <div className="field__top">
          {label && (
            <label className="field__label" htmlFor={htmlFor}>
              {label}
              {required && <span className="field__required" aria-hidden="true"> *</span>}
            </label>
          )}
          {aside}
        </div>
      )}
      {children}
      {error ? (
        <p className="field__error" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field__hint">{hint}</p>
      )}
    </div>
  );
}

export function Input({ label, error, hint, icon: Icon, required, aside, id, className = "", ...rest }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} aside={aside}>
      <div className={`input-wrap ${Icon ? "input-wrap--icon" : ""}`}>
        {Icon && <Icon size={17} className="input-wrap__icon" aria-hidden="true" />}
        <input
          id={inputId}
          className={`input ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
      </div>
    </Field>
  );
}

export function PasswordInput({ label, error, hint, icon: Icon, required, aside, id, ...rest }) {
  const autoId = useId();
  const inputId = id || autoId;
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} aside={aside}>
      <div className={`input-wrap input-wrap--action ${Icon ? "input-wrap--icon" : ""}`}>
        {Icon && <Icon size={17} className="input-wrap__icon" aria-hidden="true" />}
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className="input"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        <button
          type="button"
          className="input-wrap__action"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </Field>
  );
}

export function TextArea({ label, error, hint, required, aside, id, className = "", ...rest }) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} aside={aside}>
      <textarea
        id={inputId}
        className={`input textarea ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
    </Field>
  );
}
