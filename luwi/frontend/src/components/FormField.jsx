import Icon from "./Icon";

export default function FormField({ field, value, error, options = [], disabled, onChange }) {
  const id = `field-${field.name}`;

  const base = `w-full rounded-2xl border-2 bg-admin-bg px-4 py-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-muted focus:ring-4 focus:ring-admin-blue/10 disabled:cursor-default disabled:opacity-80 ${
    error ? "border-admin-danger" : "border-admin-line focus:border-admin-blue"
  }`;

  const common = {
    id,
    name: field.name,
    value,
    disabled,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : undefined,
    onChange: (e) => onChange(field.name, e.target.value),
  };

  let control;
  if (field.type === "select") {
    control = (
      <select {...common} className={base}>
        <option value="">{field.placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "textarea") {
    control = (
      <textarea
        {...common}
        rows={4}
        placeholder={field.placeholder}
        className={`${base} resize-y`}
      />
    );
  } else {
    control = (
      <input
        {...common}
        type={field.type || "text"}
        placeholder={field.placeholder}
        className={base}
      />
    );
  }

  return (
    <div className={field.half ? "" : "sm:col-span-2"}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-admin-ink">
        {field.label}
        {field.required && !disabled && <span className="text-admin-danger"> *</span>}
      </label>
      {control}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-admin-danger">
          <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}