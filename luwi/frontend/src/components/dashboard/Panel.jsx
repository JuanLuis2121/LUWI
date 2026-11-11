/** Contenedor con título para bloques del dashboard (gráficas, listas). */
export default function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-luwi-border bg-white p-5 shadow-card ${className}`}>
      <header className="mb-4">
        <h2 className="font-semibold text-luwi-navy">{title}</h2>
        {subtitle && <p className="text-xs text-luwi-muted">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
