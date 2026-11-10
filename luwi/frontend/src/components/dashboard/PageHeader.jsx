/** Título + descripción de cada pantalla del dashboard. */
export default function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-luwi-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-luwi-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
