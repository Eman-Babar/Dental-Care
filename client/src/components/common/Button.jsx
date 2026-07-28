function Button({
  children,
  type = "button",
  onClick,
  className = "",
  disabled = false,
  variant = "primary",
}) {
  const base = variant === "secondary" ? "btn-secondary" : "btn-primary";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
