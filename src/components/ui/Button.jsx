import { Link } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

// variant: primary | secondary | ghost | soft | danger
// size:    sm | md | lg
export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  fullWidth = false,
  to,
  className = "",
  disabled,
  type = "button",
  ...rest
}) {
  const classes = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? "btn--full" : "",
    loading ? "is-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? 15 : 17;
  const content = (
    <>
      {loading ? (
        <LoaderCircle size={iconSize} className="spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={iconSize} aria-hidden="true" />
      )}
      {children && <span>{children}</span>}
      {IconRight && !loading && <IconRight size={iconSize} aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}
