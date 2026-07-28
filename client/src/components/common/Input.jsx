function Input({
  label,
  type = "text",
  placeholder,
  name,
  value,
  onChange,
  id,
}) {
  const inputId = id || name;

  return (
    <div>
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="field"
      />
    </div>
  );
}

export default Input;
