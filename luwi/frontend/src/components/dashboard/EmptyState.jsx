/** Estado vacío / "en construcción" para pantallas aún sin contenido. */
export default function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-luwi-border bg-white px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-luwi-bg text-luwi-blue">
          <Icon className="h-7 w-7" />
        </span>
      )}
      <h2 className="text-lg font-semibold text-luwi-navy">{title}</h2>
      {text && <p className="mt-1 max-w-sm text-sm text-luwi-muted">{text}</p>}
    </div>
  );
}
