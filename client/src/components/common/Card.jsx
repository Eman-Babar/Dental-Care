function Card({ children, className = "" }) {
  return (
    <div
      className={`border border-[var(--line)] bg-[var(--surface)] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
