import Icon from "./Icon";

// Controles de formulario con la paleta de administración (mismo estilo que Rutas).

export const inputCls = (error) =>
  `w-full rounded-2xl border-2 bg-admin-bg px-4 py-3 text-sm text-admin-ink outline-none transition placeholder:text-admin-muted focus:ring-4 focus:ring-admin-blue/10 disabled:cursor-default disabled:opacity-80 ${
    error ? "border-admin-danger" : "border-admin-line focus:border-admin-blue"
  }`;

export function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-admin-danger">
      <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
      {children}
    </p>
  );
}

export function Label({ htmlFor, required, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold text-admin-ink">
      {children} {required && <span className="text-admin-danger">*</span>}
    </label>
  );
}

// Aviso de error general (servidor o validación) arriba de un formulario o tabla.
export function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border-2 border-admin-danger bg-red-50 px-5 py-3.5 text-sm font-semibold text-admin-danger"
    >
      <Icon name="alert" className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export function SuccessBanner({ children }) {
  if (!children) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-700"
    >
      <Icon name="check" className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}
